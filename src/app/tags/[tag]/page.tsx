import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import PostList from "@/components/post/PostList";
import Sidebar from "@/components/layout/Sidebar";
import Pagination from "@/components/shared/Pagination";
import { POSTS_PER_PAGE } from "@/lib/constants";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${decodeURIComponent(tag)} - WebClaw` };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1"));

  const where = { isPublished: true, tags: { contains: tag } };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { comments: true, likes: true } } },
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.post.count({ where }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        <span className="text-primary">#</span> {tag}
      </h1>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <PostList posts={posts} />
          <Pagination currentPage={page} totalPages={Math.ceil(total / POSTS_PER_PAGE)} basePath={`/tags/${encodeURIComponent(tag)}`} />
        </div>
        <div className="hidden lg:block w-72 shrink-0">
          <Suspense fallback={null}><Sidebar /></Suspense>
        </div>
      </div>
    </div>
  );
}
