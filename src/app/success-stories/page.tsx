import type { Metadata } from "next";
import TopicLanding from "@/components/topic/TopicLanding";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "成果案例 - Medbot", description: "AI 应用落地成果与实践案例" };
export const dynamic = "force-dynamic";

export default async function SuccessStoriesPage() {
  const posts = await prisma.post.findMany({
    where: { isPublished: true, type: "blog", category: "success-stories" },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return <TopicLanding title="成果案例" description="展示团队已经交付的 AI 应用、效率提升成果与可复用的真实经验。" kind="stories" posts={posts} />;
}
