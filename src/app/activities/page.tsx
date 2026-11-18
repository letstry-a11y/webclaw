import { prisma } from "@/lib/prisma";
import PostCard from "@/components/post/PostCard";
import { Calendar } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import RecruitmentSpotlight from "@/components/ai/RecruitmentSpotlight";
import { getActiveRecruitments } from "@/lib/ai-recruitment";

export const metadata: Metadata = {
  title: "活动 - Medbot",
};

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const [activities, activeRecruitments] = await Promise.all([
    prisma.post.findMany({
      where: { isPublished: true, type: "activity" },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { comments: true, likes: true } } },
    }),
    getActiveRecruitments(),
  ]);
  const activePostIds = new Set(activeRecruitments.map((request) => request.activityPostId).filter(Boolean));
  const otherActivities = activities.filter((activity) => !activePostIds.has(activity.id));

  return (
    <div className="bg-white"><div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-[#17283f]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><Calendar className="w-6 h-6 text-primary" /><h1 className="text-2xl font-bold">社区活动</h1></div>
        <Link href="/ai-requests/new" className="inline-flex items-center gap-2 bg-[#073a83] px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" />提交 AI 项目需求</Link>
      </div>

      <RecruitmentSpotlight recruitments={activeRecruitments} compact />

      {otherActivities.length === 0 && activeRecruitments.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-lg font-medium">暂无社区活动</h2>
        </div>
      ) : (
        otherActivities.length > 0 && <section className={activeRecruitments.length > 0 ? "mt-12 border-t border-[#d8e0ee] pt-8" : ""}>
          {activeRecruitments.length > 0 && <h2 className="mb-5 text-2xl font-black text-[#111827]">其他社区活动</h2>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {otherActivities.map((activity) => <PostCard key={activity.id} post={activity} />)}
          </div>
        </section>
      )}
    </div></div>
  );
}
