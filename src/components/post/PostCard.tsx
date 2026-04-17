import Link from "next/link";
import { Eye, MessageCircle, Heart, Pin, Star } from "lucide-react";
import { formatDate, formatCount } from "@/lib/utils";
import type { PostWithCounts } from "@/types";

interface PostCardProps {
  post: PostWithCounts;
}

export default function PostCard({ post }: PostCardProps) {
  const commentCount = post._count?.comments ?? 0;
  const tags = post.tags.split(",").filter(Boolean).map((t) => t.trim());

  return (
    <article className="bg-white rounded-xl border border-border-light hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
      <Link href={post.type === "activity" ? `/activities/${post.slug}` : `/posts/${post.slug}`}>
        {/* Cover Image */}
        {post.coverImage && (
          <div className="aspect-video overflow-hidden bg-bg">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <div className="p-5">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-2">
            {post.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded-full">
                <Pin className="w-3 h-3" />
                置顶
              </span>
            )}
            {post.isFeatured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning rounded-full">
                <Star className="w-3 h-3" />
                精品
              </span>
            )}
            {post.type === "activity" && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full">
                活动
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {post.title}
          </h2>

          {/* Excerpt */}
          <p className="text-sm text-text-secondary line-clamp-2 mb-3">
            {post.excerpt}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-tag-bg text-tag-text rounded"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-text-tertiary">+{tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-text-tertiary pt-3 border-t border-border-light">
            <div className="flex items-center gap-1">
              <span className="text-text-secondary font-medium">{post.authorName}</span>
              <span className="mx-1">·</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {formatCount(post.viewCount)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                {formatCount(post.likeCount)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {commentCount}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
