import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import AdminCommentActions from "@/components/admin/AdminCommentActions";

export default async function AdminCommentsPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: { post: { select: { title: true, slug: true } } },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">评论管理</h1>

      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        <div className="space-y-0 divide-y divide-border-light">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 hover:bg-bg/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-text-primary">{comment.authorName}</span>
                    <span className="text-xs text-text-tertiary">{formatDate(comment.createdAt)}</span>
                    <span className="text-xs text-text-tertiary">
                      在 <a href={`/posts/${comment.post.slug}`} className="text-primary hover:underline">{comment.post.title}</a>
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{comment.content}</p>
                </div>
                <AdminCommentActions commentId={comment.id} />
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className="p-8 text-center text-text-tertiary text-sm">暂无评论</div>
          )}
        </div>
      </div>
    </div>
  );
}
