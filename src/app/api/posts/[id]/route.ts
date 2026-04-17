import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { getFingerprint } from "@/lib/fingerprint";
import { attachmentSchema } from "@/lib/validators";
import { generateExcerpt } from "@/lib/utils";
import { z } from "zod";

const ADMIN_ONLY_ACTIONS = new Set(["togglePin", "toggleFeatured", "togglePublish"]);

const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  coverImage: z
    .string()
    .max(2000)
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "封面图片必须是 URL 或上传路径")
    .optional()
    .or(z.literal("")),
  category: z.string().optional(),
  tags: z.string().optional(),
  authorName: z.string().max(50).optional(),
  attachments: z.array(attachmentSchema).max(20).optional(),
});

async function canWrite(postId: string): Promise<{ allowed: boolean; status: number; post?: { authorFingerprint: string } }> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorFingerprint: true },
  });
  if (!post) return { allowed: false, status: 404 };
  if (await isAdmin()) return { allowed: true, status: 200, post };
  const fp = await getFingerprint();
  if (post.authorFingerprint && post.authorFingerprint === fp) {
    return { allowed: true, status: 200, post };
  }
  return { allowed: false, status: 403, post };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.action && ADMIN_ONLY_ACTIONS.has(body.action)) {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (body.action === "togglePin") {
        await prisma.post.update({ where: { id }, data: { isPinned: !post.isPinned } });
      } else if (body.action === "toggleFeatured") {
        await prisma.post.update({ where: { id }, data: { isFeatured: !post.isFeatured } });
      } else if (body.action === "togglePublish") {
        await prisma.post.update({ where: { id }, data: { isPublished: !post.isPublished } });
      }
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
  }

  const check = await canWrite(id);
  if (!check.allowed) {
    return NextResponse.json(
      { error: check.status === 404 ? "Not found" : "Forbidden" },
      { status: check.status }
    );
  }

  try {
    const data = updatePostSchema.parse(body);
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) {
      updateData.content = data.content;
      updateData.excerpt = data.excerpt || generateExcerpt(data.content);
    } else if (data.excerpt !== undefined) {
      updateData.excerpt = data.excerpt;
    }
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage || null;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.authorName !== undefined) updateData.authorName = data.authorName || "匿名用户";
    if (data.attachments !== undefined) {
      updateData.attachments = data.attachments.length ? JSON.stringify(data.attachments) : "";
    }

    await prisma.post.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/posts/[id] error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await canWrite(id);
  if (!check.allowed) {
    return NextResponse.json(
      { error: check.status === 404 ? "Not found" : "Forbidden" },
      { status: check.status }
    );
  }
  try {
    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
