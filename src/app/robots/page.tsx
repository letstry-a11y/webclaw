import type { Metadata } from "next";
import TopicLanding from "@/components/topic/TopicLanding";

export const metadata: Metadata = { title: "机器人 - Medbot", description: "机器人、智能体与自动化实践" };
export default function RobotsPage() {
  return <TopicLanding title="机器人" description="关注智能机器人、Agent 自动化、语音交互以及 Medbot 产品的落地进展。" kind="robots" posts={[]} />;
}
