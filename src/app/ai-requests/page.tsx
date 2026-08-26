import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AiRequestForm from "./AiRequestForm";
import { formatProjectDate, requestStatusMeta, type AiRequestStatus } from "@/lib/ai-project-workflow";
import { ArrowRight, Building2, CalendarClock, CheckCircle2, CircleDollarSign, ClipboardCheck, ClipboardList, Handshake, Plus, ShieldCheck, Sparkles, UserCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "AI 项目需求与招募 - Medbot",
  description: "提交 AI 应用需求，经AI发展委员会评审、公开招募、组队交付并进入积分榜",
};
export const dynamic = "force-dynamic";

const processGroups = [
  { key: "pending-review", title: "待AI发展委员会评审", description: "新需求等待确认项目等级与基础积分总包", statuses: ["pending_review"], icon: ClipboardList, accent: "border-l-[#d49a32]", iconTone: "bg-[#fff4df] text-[#8a5700]" },
  { key: "recruiting", title: "社区招募中", description: "需求已通过评审，正在公开征集团队成员", statuses: ["recruiting"], icon: Users, accent: "border-l-[#4870ff]", iconTone: "bg-[#eef2ff] text-[#032a72]" },
  { key: "executing", title: "项目执行中", description: "包含团队确认、开发和试用评估阶段", statuses: ["team_confirmed", "developing", "trial"], icon: Sparkles, accent: "border-l-[#2f7bc1]", iconTone: "bg-[#edf5ff] text-[#14569b]" },
  { key: "closing-review", title: "待结题评审", description: "成果已交付，等待 AI发展委员会确认成效系数", statuses: ["delivered_pending_review"], icon: ClipboardCheck, accent: "border-l-[#7961c5]", iconTone: "bg-[#f4f0ff] text-[#58409a]" },
  { key: "point-allocation", title: "待积分分配", description: "成效系数已确定，等待项目负责人分配个人积分", statuses: ["scored_pending_allocation"], icon: CircleDollarSign, accent: "border-l-[#9b6ac7]", iconTone: "bg-[#f7f0fb] text-[#65407e]" },
  { key: "warranty", title: "质保中", description: "首期积分已发放，等待质保结束并发放剩余积分", statuses: ["warranty"], icon: ShieldCheck, accent: "border-l-[#35a762]", iconTone: "bg-[#edf9f1] text-[#13743a]" },
  { key: "completed", title: "已结题", description: "项目、质保和积分发放均已完成", statuses: ["completed"], icon: CheckCircle2, accent: "border-l-[#1d7e47]", iconTone: "bg-[#e7f7ed] text-[#116333]" },
] as const;

export default async function AiRequestsPage() {
  const requests = await prisma.aiDemandRequest.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      teamMembers: { where: { isLead: true }, take: 1, select: { name: true } },
    },
  });

  const recruitingCount = requests.filter((request) => request.status === "recruiting").length;
  const activeCount = requests.filter((request) => ["team_confirmed", "developing", "trial", "delivered_pending_review", "scored_pending_allocation", "warranty"].includes(request.status)).length;

  return (
    <div className="min-h-full bg-white text-[#111827]">
      <header className="border-b border-[#244b91] bg-[#032a72] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-[#b8c6ff]"><ClipboardList className="h-4 w-4" /> AI PROJECT INTAKE</div>
              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">AI 项目需求与招募</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">需求从这里开始，经 AI发展委员会评审后进入社区招募；团队确认后自动进入看板，AI发展委员会确定成效系数后由项目负责人完成积分分配。</p>
            </div>
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 bg-[#4870ff] px-5 py-3 text-sm font-black text-white hover:bg-[#5b80ff]"><Plus className="h-4 w-4" /> 提交 AI 应用需求</summary>
              <AiRequestForm />
            </details>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="grid border border-[#d8e0ee] bg-[#f7f9fc] sm:grid-cols-3" aria-label="AI 项目流程概览">
          <div className="border-b border-[#d8e0ee] p-5 sm:border-b-0 sm:border-r"><ClipboardList className="h-5 w-5 text-[#4870ff]" /><p className="mt-3 text-xs font-bold text-[#6b7890]">需求总数</p><strong className="mt-1 block text-3xl font-black">{requests.length}</strong></div>
          <div className="border-b border-[#d8e0ee] p-5 sm:border-b-0 sm:border-r"><Users className="h-5 w-5 text-[#4870ff]" /><p className="mt-3 text-xs font-bold text-[#6b7890]">正在招募</p><strong className="mt-1 block text-3xl font-black">{recruitingCount}</strong></div>
          <div className="p-5"><Sparkles className="h-5 w-5 text-[#4870ff]" /><p className="mt-3 text-xs font-bold text-[#6b7890]">执行与评审中</p><strong className="mt-1 block text-3xl font-black">{activeCount}</strong></div>
        </section>

        <div className="mt-12 flex items-end justify-between border-b-2 border-black pb-3"><div><h2 className="text-3xl font-black tracking-[-0.03em]">项目流程</h2><p className="mt-1 text-xs text-[#6b7890]">所有需求、评审和积分节点公开透明。</p></div><Link href="/activities" className="inline-flex items-center gap-1 text-sm font-bold text-[#032a72]">查看社区招募 <ArrowRight className="h-4 w-4 text-[#4870ff]" /></Link></div>

        {requests.length > 0 ? (
          <div className="mt-8 space-y-8" aria-label="按流程节点分类的 AI 项目列表">
            {processGroups.map((group) => {
              const groupedRequests = requests.filter((request) => (group.statuses as readonly string[]).includes(request.status));
              const Icon = group.icon;
              return (
                <section key={group.key} className={`border border-[#d8e0ee] border-l-4 bg-[#fafbfd] ${group.accent}`} aria-labelledby={`group-${group.key}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d8e0ee] px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center ${group.iconTone}`}><Icon className="h-5 w-5" /></span>
                      <div><h3 id={`group-${group.key}`} className="text-xl font-black">{group.title}</h3><p className="mt-0.5 text-xs text-[#6b7890]">{group.description}</p></div>
                    </div>
                    <strong className="flex h-8 min-w-8 items-center justify-center bg-white px-2.5 font-mono text-sm text-[#032a72] shadow-[inset_0_0_0_1px_#d8e0ee]">{groupedRequests.length}</strong>
                  </div>

                  {groupedRequests.length > 0 ? (
                    <div className="grid gap-px bg-[#d8e0ee] md:grid-cols-2">
                      {groupedRequests.map((request, index) => {
                        const status = requestStatusMeta[request.status as AiRequestStatus] ?? requestStatusMeta.pending_review;
                        const lead = request.teamMembers[0]?.name ?? "待确认";
                        const fillsLastRow = groupedRequests.length % 2 === 1 && index === groupedRequests.length - 1;
                        return (
                          <Link key={request.id} href={`/ai-requests/${request.id}`} className={`group bg-white p-5 hover:bg-[#f8faff] sm:p-6 ${fillsLastRow ? "md:col-span-2" : ""}`}>
                            <div className="flex items-start justify-between gap-3"><span className={`inline-flex border px-2.5 py-1 text-[10px] font-black ${status.tone}`}>{status.label}</span><span className="font-mono text-[10px] text-[#9aa6ba]">更新 {formatProjectDate(request.updatedAt)}</span></div>
                            <h4 className="mt-4 text-lg font-black leading-snug group-hover:text-[#032a72]">{request.title}</h4>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#52627d]">{request.businessValue}</p>
                            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#e2e8f2] pt-4 text-xs">
                              <div className="flex min-w-0 items-center gap-1.5"><Building2 className="h-3.5 w-3.5 shrink-0 text-[#8491a8]" /><dt className="text-[#8491a8]">需求方</dt><dd className="truncate font-bold text-[#34445e]">{request.requesterName} · {request.requesterDepartment}</dd></div>
                              <div className="flex min-w-0 items-center gap-1.5"><UserCheck className="h-3.5 w-3.5 shrink-0 text-[#8491a8]" /><dt className="text-[#8491a8]">负责人</dt><dd className="truncate font-bold text-[#34445e]">{lead}</dd></div>
                              <div className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#8491a8]" /><dt className="text-[#8491a8]">等级</dt><dd className="font-bold text-[#34445e]">{request.projectLevel ? `${request.projectLevel} 级` : "待评审"}</dd></div>
                              <div className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-[#8491a8]" /><dt className="text-[#8491a8]">积分包</dt><dd className="font-bold text-[#34445e]">{request.basePointPool?.toLocaleString("zh-CN") ?? "待评审"}</dd></div>
                              <div className="col-span-2 flex min-w-0 items-center gap-1.5"><Handshake className="h-3.5 w-3.5 shrink-0 text-[#8491a8]" /><dt className="text-[#8491a8]">AI发展委员会协助人</dt><dd className="truncate font-bold text-[#34445e]">{request.committeeAssistant || "待评审时指定"}</dd></div>
                            </dl>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white px-5 py-5 text-sm text-[#8491a8] sm:px-6">该节点暂无项目</div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 border border-dashed border-[#cbd5e6] bg-[#fafbfd] py-20 text-center"><ClipboardList className="mx-auto h-10 w-10 text-[#4870ff]" /><h3 className="mt-4 text-xl font-black">还没有 AI 应用需求</h3><p className="mt-2 text-sm text-[#6b7890]">点击页面右上角提交第一条需求。</p></div>
        )}
      </main>
    </div>
  );
}
