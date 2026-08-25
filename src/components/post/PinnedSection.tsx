import Link from "next/link";
import { Pin, Star, Eye, Heart } from "lucide-react";
import { formatCount } from "@/lib/utils";
import type { PostWithCounts } from "@/types";

interface PinnedSectionProps {
  posts: PostWithCounts[];
}

export default function PinnedSection({ posts }: PinnedSectionProps) {
  if (posts.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-thin">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={post.type === "activity" ? `/activities/${post.slug}` : `/posts/${post.slug}`}
            className="relative flex-none w-72 overflow-hidden bg-[#111411] p-5 border border-primary/35 hover:border-primary hover:shadow-[0_12px_40px_rgba(118,185,0,0.12)] transition-all group before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary"
          >
            <div className="flex items-center gap-2 mb-2">
              {post.isPinned && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                  <Pin className="w-3 h-3" />
                  置顶
                </span>
              )}
              {post.isFeatured && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                  <Star className="w-3 h-3" />
                  精品
                </span>
              )}
              {post.type === "activity" && (
                <span className="text-xs font-medium text-success">活动</span>
              )}
            </div>
            <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {post.title}
            </h3>
            <p className="text-xs text-text-secondary line-clamp-2 mb-3">{post.excerpt}</p>
            <div className="flex items-center gap-3 text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatCount(post.viewCount)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {formatCount(post.likeCount)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
