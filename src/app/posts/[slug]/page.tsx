import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Eye, Calendar, Tag, User, Paperclip, Download, FileText } from "lucide-react";
import Link from "next/link";
import LikeButton from "@/components/shared/LikeButton";
import CommentSection from "@/components/comment/CommentSection";
import ViewCounter from "@/components/shared/ViewCounter";
import type { Metadata } from "next";
import type { Attachment } from "@/lib/validators";

function parseAttachments(raw: string): Attachment[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return { title: "文章未找到" };
  return {
    title: `${post.title} - WebClaw`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);

  const post = await prisma.post.findUnique({
    where: { slug, isPublished: true },
    include: {
      _count: { select: { likes: true } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        include: {
          replies: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!post) notFound();

  const tags = post.tags.split(",").filter(Boolean).map((t) => t.trim());
  const attachments = parseAttachments(post.attachments);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <ViewCounter postId={post.id} />

      {/* Article Header */}
      <article>
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-4">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {post.authorName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {post.viewCount} 阅读
            </span>
            <Link
              href={`/categories/${post.category}`}
              className="flex items-center gap-1.5 text-primary hover:underline"
            >
              <Tag className="w-4 h-4" />
              {post.category}
            </Link>
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

        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img src={post.coverImage} alt={post.title} className="w-full" />
          </div>
        )}

        {/* Content */}
        <div
          className="post-content bg-white rounded-xl p-6 sm:p-8 border border-border-light mb-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-8 bg-white rounded-xl border border-border-light p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary mb-4">
              <Paperclip className="w-4 h-4 text-primary" />
              附件 ({attachments.length})
            </h2>
            <ul className="space-y-2">
              {attachments.map((att) => (
                <li key={att.url}>
                  <a
                    href={att.url}
                    download={att.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-3 py-2.5 border border-border-light rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-text-secondary group-hover:text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-primary truncate group-hover:text-primary">
                        {att.name}
                      </div>
                      <div className="text-xs text-text-tertiary">{formatSize(att.size)}</div>
                    </div>
                    <Download className="w-4 h-4 text-text-tertiary group-hover:text-primary shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center py-6">
          <LikeButton postId={post.id} initialCount={post.likeCount} />
        </div>
      </article>

      {/* Comments */}
      <CommentSection postId={post.id} comments={post.comments} />
    </div>
  );
}
