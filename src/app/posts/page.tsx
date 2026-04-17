import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import PostList from "@/components/post/PostList";
import Sidebar from "@/components/layout/Sidebar";
import CategoryNav from "@/components/shared/CategoryNav";
import Pagination from "@/components/shared/Pagination";
import { POSTS_PER_PAGE } from "@/lib/constants";

interface Props {
  searchParams: Promise<{ category?: string; page?: string; sort?: string }>;
}

export default async function PostsPage({ searchParams }: Props) {
  const params = await searchParams;
  const category = params.category || "";
  const page = Math.max(1, parseInt(params.page || "1"));
  const sort = params.sort || "latest";

  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  const where = {
    isPublished: true,
    type: "blog" as const,
    ...(category ? { category } : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: sort === "popular"
        ? { viewCount: "desc" }
        : [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { comments: true, likes: true } } },
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-4">博客文章</h1>
        <Suspense fallback={null}>
          <CategoryNav categories={categories} />
        </Suspense>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {/* Sort tabs */}
          <div className="flex items-center gap-4 mb-4">
            <a
              href={`/posts?${category ? `category=${category}&` : ""}sort=latest`}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors ${sort === "latest" ? "text-primary border-primary" : "text-text-secondary border-transparent hover:text-text-primary"}`}
            >
              最新
            </a>
            <a
              href={`/posts?${category ? `category=${category}&` : ""}sort=popular`}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors ${sort === "popular" ? "text-primary border-primary" : "text-text-secondary border-transparent hover:text-text-primary"}`}
            >
              热门
            </a>
          </div>

          <PostList posts={posts} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/posts"
            searchParams={{ ...(category ? { category } : {}), sort }}
          />
        </div>

        <div className="hidden lg:block w-72 shrink-0">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
