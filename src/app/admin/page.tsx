import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FileText, MessageCircle, Eye, Heart } from "lucide-react";

export default async function AdminDashboard() {
  if (!(await isAdmin())) redirect("/admin/login");

  const [postCount, commentCount, totalViews, totalLikes] = await Promise.all([
    prisma.post.count(),
    prisma.comment.count(),
    prisma.post.aggregate({ _sum: { viewCount: true } }),
    prisma.post.aggregate({ _sum: { likeCount: true } }),
  ]);

  const stats = [
    { label: "文章总数", value: postCount, icon: FileText, color: "text-primary" },
    { label: "评论总数", value: commentCount, icon: MessageCircle, color: "text-success" },
    { label: "总阅读量", value: totalViews._sum.viewCount || 0, icon: Eye, color: "text-warning" },
    { label: "总点赞数", value: totalLikes._sum.likeCount || 0, icon: Heart, color: "text-accent" },
  ];

  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, slug: true, type: true, viewCount: true, likeCount: true, createdAt: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">管理仪表盘</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-border-light">
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm text-text-secondary">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-text-primary">{stat.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border-light p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">最近文章</h2>
        <div className="space-y-3">
          {recentPosts.map((post) => (
            <div key={post.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
              <div>
                <span className="text-sm font-medium text-text-primary">{post.title}</span>
                <span className="ml-2 text-xs text-text-tertiary">
                  {post.type === "activity" ? "活动" : "博客"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-tertiary">
                <span>{post.viewCount} 阅读</span>
                <span>{post.likeCount} 点赞</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
