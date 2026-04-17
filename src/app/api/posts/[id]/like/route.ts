import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFingerprint } from "@/lib/fingerprint";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fingerprint = await getFingerprint();

  try {
    // Check if already liked
    const existing = await prisma.like.findUnique({
      where: { postId_fingerprint: { postId: id, fingerprint } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already liked" }, { status: 409 });
    }

    // Create like and increment count
    await prisma.$transaction([
      prisma.like.create({
        data: { postId: id, fingerprint },
      }),
      prisma.post.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    const post = await prisma.post.findUnique({
      where: { id },
      select: { likeCount: true },
    });

    return NextResponse.json({ likeCount: post?.likeCount ?? 0 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
