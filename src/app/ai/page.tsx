import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import TopicLanding from "@/components/topic/TopicLanding";

export const metadata: Metadata = { title: "AI - Medbot", description: "AI 技术、工具与应用实践" };
export const dynamic = "force-dynamic";

export default async function AiPage() {
  const [matched, latest] = await Promise.all([
    prisma.post.findMany({
      where: { isPublished: true, type: "blog", OR: [{ title: { contains: "AI" } }, { tags: { contains: "AI" } }, { content: { contains: "AI" } }] },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], take: 8,
    }),
    prisma.post.findMany({ where: { isPublished: true, type: "blog" }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const posts = [...matched, ...latest.filter((post) => !matched.some((item) => item.id === post.id))].slice(0, 8);
  return <TopicLanding title="AI" description="聚合人工智能技术趋势、工具探索、模型应用与团队的一线实践。" kind="ai" posts={posts} />;
}
