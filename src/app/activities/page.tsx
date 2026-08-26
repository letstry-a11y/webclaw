import { prisma } from "@/lib/prisma";
import PostCard from "@/components/post/PostCard";
import { Calendar } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "活动 - Medbot",
};

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const activities = await prisma.post.findMany({
    where: { isPublished: true, type: "activity" },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { comments: true, likes: true } } },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><Calendar className="w-6 h-6 text-primary" /><h1 className="text-2xl font-bold text-text-primary">社区活动</h1></div>
        <Link href="/ai-requests" className="inline-flex items-center gap-2 bg-[#4870ff] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#5b80ff]"><Plus className="h-4 w-4" />提交 AI 项目需求</Link>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-lg font-medium text-text-primary mb-2">暂无活动</h3>
          <p className="text-sm text-text-secondary">敬请期待新的活动发布！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((activity) => (
            <PostCard key={activity.id} post={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
