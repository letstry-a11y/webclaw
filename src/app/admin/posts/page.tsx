import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import AdminPostActions from "@/components/admin/AdminPostActions";

export default async function AdminPostsPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { comments: true, likes: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">文章管理</h1>

      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">标题</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">类型</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">状态</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">数据</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">时间</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-border-light hover:bg-bg/30">
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <div className="font-medium text-text-primary truncate">{post.title}</div>
                      <div className="text-xs text-text-tertiary">{post.authorName}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${post.type === "activity" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
                      {post.type === "activity" ? "活动" : "博客"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {post.isPinned && <span className="px-1.5 py-0.5 text-xs bg-accent/10 text-accent rounded">置顶</span>}
                      {post.isFeatured && <span className="px-1.5 py-0.5 text-xs bg-warning/10 text-warning rounded">精品</span>}
                      {!post.isPublished && <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">未发布</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-tertiary">
                    <span>{post.viewCount} 阅读</span> · <span>{post.likeCount} 赞</span> · <span>{post._count.comments} 评论</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-tertiary">{formatDate(post.createdAt)}</td>
                  <td className="px-4 py-3">
                    <AdminPostActions post={post} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
