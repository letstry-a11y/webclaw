import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ posts: [] });

  const posts = await prisma.post.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: q } },
        { excerpt: { contains: q } },
        { tags: { contains: q } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, excerpt: true, type: true },
    take: 10,
  });

  return NextResponse.json({ posts });
}
