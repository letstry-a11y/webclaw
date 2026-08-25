import type { Metadata } from "next";
import AiProjectsDashboard from "@/app/admin/ai-projects/page";

export const metadata: Metadata = {
  title: "AI 应用项目看板 - Medbot",
  description: "公司内部 AI 产品进展、负责人及行动项公开看板",
};

export const dynamic = "force-dynamic";

export default function PublicAiProjectsPage() {
  return (
    <div className="min-h-full bg-white text-[#111411]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <AiProjectsDashboard />
      </div>
    </div>
  );
}
