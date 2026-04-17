import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/validators";
import { slugify, generateExcerpt } from "@/lib/utils";
import { getFingerprint } from "@/lib/fingerprint";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") || "";
  const type = searchParams.get("type") || "blog";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "12"));

  const where = {
    isPublished: true,
    type,
    ...(category ? { category } : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { comments: true, likes: true } } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createPostSchema.parse(body);

    // Generate slug
    let slug = slugify(data.title);
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const fingerprint = await getFingerprint();
    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt || generateExcerpt(data.content),
        coverImage: data.coverImage || null,
        category: data.category,
        tags: data.tags,
        authorName: data.authorName || "匿名用户",
        authorFingerprint: fingerprint,
        type: data.type,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        eventLocation: data.eventLocation || null,
        eventLink: data.eventLink || null,
        attachments: data.attachments.length ? JSON.stringify(data.attachments) : "",
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
