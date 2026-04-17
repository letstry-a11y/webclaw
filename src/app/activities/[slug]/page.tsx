import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Eye, Calendar, MapPin, ExternalLink, Tag } from "lucide-react";
import Link from "next/link";
import LikeButton from "@/components/shared/LikeButton";
import CommentSection from "@/components/comment/CommentSection";
import ViewCounter from "@/components/shared/ViewCounter";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return { title: "活动未找到" };
  return { title: `${post.title} - WebClaw`, description: post.excerpt };
}

export default async function ActivityPage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const post = await prisma.post.findUnique({
    where: { slug, isPublished: true, type: "activity" },
    include: {
      _count: { select: { likes: true } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        include: { replies: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!post) notFound();

  const tags = post.tags.split(",").filter(Boolean).map((t) => t.trim());

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <ViewCounter postId={post.id} />

      <article>
        <header className="mb-8">
          <div className="inline-flex items-center px-3 py-1 text-sm font-medium bg-success/10 text-success rounded-full mb-4">
            活动
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {post.viewCount} 阅读
            </span>
            {post.eventLocation && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {post.eventLocation}
              </span>
            )}
            {post.eventLink && (
              <a
                href={post.eventLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                活动链接
              </a>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="px-3 py-1 text-xs bg-tag-bg text-tag-text rounded-full hover:bg-primary hover:text-white transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        <div className="post-content bg-white rounded-xl p-6 sm:p-8 border border-border-light mb-8" dangerouslySetInnerHTML={{ __html: post.content }} />

        <div className="flex items-center justify-center py-6">
          <LikeButton postId={post.id} initialCount={post.likeCount} />
        </div>
      </article>

      <CommentSection postId={post.id} comments={post.comments} />
    </div>
  );
}
