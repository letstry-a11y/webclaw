import Link from "next/link";
import AiRequestForm from "../AiRequestForm";

export const metadata = { title: "提交 AI 应用需求 · Medbot" };

export default function NewRequestPage() {
  return <div className="bg-[#f5f7fb] px-4 py-9 text-[#17283f]"><div className="mx-auto max-w-3xl">
    <Link href="/ai-requests" className="text-sm font-bold text-[#194c94]">← 需求与招募</Link>
    <h1 className="mt-4 text-3xl font-bold text-[#102b51]">提交 AI 应用需求</h1>
    <p className="mb-6 mt-2 text-sm leading-6">请描述业务问题、预期成果和所需人员。提交后由 AI发展委员会评审，确定协助人、项目等级与基础积分。</p>
    <AiRequestForm/>
  </div></div>;
}
