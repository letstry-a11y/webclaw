import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TrendingUp, Tag, Calendar } from "lucide-react";

export default async function Sidebar() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  const hotPosts = await prisma.post.findMany({
    where: { isPublished: true, type: "blog" },
    orderBy: { viewCount: "desc" },
    take: 5,
    select: { id: true, title: true, slug: true, viewCount: true },
  });

  const activities = await prisma.post.findMany({
    where: { isPublished: true, type: "activity" },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, title: true, slug: true, createdAt: true },
  });

  // Get popular tags
  const allPosts = await prisma.post.findMany({
    where: { isPublished: true },
    select: { tags: true },
  });
  const tagCounts: Record<string, number> = {};
  allPosts.forEach((post) => {
    post.tags.split(",").filter(Boolean).forEach((tag) => {
      const t = tag.trim();
      if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const popularTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([tag]) => tag);

  return (
    <aside className="space-y-6">
      {/* Categories */}
      <div className="bg-white rounded-xl p-5 border border-border-light">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          分类
        </h3>
        <div className="space-y-1">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Hot Tags */}
      {popularTags.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-border-light">
          <h3 className="text-sm font-semibold text-text-primary mb-3">热门标签</h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="px-3 py-1 text-xs bg-tag-bg text-tag-text rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending Posts */}
      {hotPosts.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-border-light">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            热门文章
          </h3>
          <div className="space-y-3">
            {hotPosts.map((post, index) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="flex items-start gap-3 group"
              >
                <span className={`text-sm font-bold shrink-0 w-5 text-center ${index < 3 ? "text-accent" : "text-text-tertiary"}`}>
                  {index + 1}
                </span>
                <span className="text-sm text-text-secondary group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {activities.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-border-light">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-success" />
            最新活动
          </h3>
          <div className="space-y-3">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={`/activities/${activity.slug}`}
                className="block text-sm text-text-secondary hover:text-primary transition-colors line-clamp-2"
              >
                {activity.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
