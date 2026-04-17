import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import PostList from "@/components/post/PostList";
import Sidebar from "@/components/layout/Sidebar";
import { Search } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  return { title: sp.q ? `搜索: ${sp.q} - WebClaw` : "搜索 - WebClaw" };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = sp.q?.trim() || "";

  const posts = query
    ? await prisma.post.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: query } },
            { excerpt: { contains: query } },
            { tags: { contains: query } },
            { content: { contains: query } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { comments: true, likes: true } } },
        take: 20,
      })
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Search className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-text-primary">
          {query ? `搜索: "${query}"` : "搜索"}
        </h1>
        {query && (
          <span className="text-sm text-text-secondary ml-2">
            找到 {posts.length} 篇文章
          </span>
        )}
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {!query ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-text-secondary">输入关键词搜索文章</p>
            </div>
          ) : (
            <PostList posts={posts} />
          )}
        </div>
        <div className="hidden lg:block w-72 shrink-0">
          <Suspense fallback={null}><Sidebar /></Suspense>
        </div>
      </div>
    </div>
  );
}
