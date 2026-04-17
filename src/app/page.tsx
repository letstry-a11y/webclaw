import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import PostList from "@/components/post/PostList";
import PinnedSection from "@/components/post/PinnedSection";
import Sidebar from "@/components/layout/Sidebar";
import CategoryNav from "@/components/shared/CategoryNav";

export default async function HomePage() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  const pinnedPosts = await prisma.post.findMany({
    where: { isPublished: true, OR: [{ isPinned: true }, { isFeatured: true }] },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { comments: true, likes: true } } },
    take: 6,
  });

  const latestPosts = await prisma.post.findMany({
    where: { isPublished: true, type: "blog" },
    orderBy: [{ isPinned: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { comments: true, likes: true } } },
    take: 12,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Category Navigation */}
      <Suspense fallback={null}>
        <div className="mb-6">
          <CategoryNav categories={categories} basePath="/posts" />
        </div>
      </Suspense>

      {/* Pinned Posts */}
      <PinnedSection posts={pinnedPosts} />

      {/* Main Content + Sidebar */}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">最新文章</h2>
          </div>
          <PostList posts={latestPosts} />
        </div>

        {/* Sidebar - hidden on mobile */}
        <div className="hidden lg:block w-72 shrink-0">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
