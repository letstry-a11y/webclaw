import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createAiRequest } from "./actions";
import { formatProjectDate, requestStatusMeta, type AiRequestStatus } from "@/lib/ai-project-workflow";
import { ArrowRight, Building2, CalendarClock, ClipboardList, Mail, Plus, Sparkles, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "AI 项目需求与招募 - Medbot",
  description: "提交 AI 应用需求，经委员会评审、公开招募、组队交付并进入积分榜",
};
export const dynamic = "force-dynamic";

const fieldClass = "w-full border border-[#cbd5e6] bg-white px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#8491a8] focus:border-[#4870ff] focus:outline-none focus:ring-1 focus:ring-[#4870ff]";
const labelClass = "mb-1.5 block text-xs font-bold text-[#52627d]";

export default async function AiRequestsPage() {
  const requests = await prisma.aiDemandRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true, teamMembers: true } } },
  });

  const recruitingCount = requests.filter((request) => request.status === "recruiting").length;
  const activeCount = requests.filter((request) => ["team_confirmed", "developing", "trial", "delivered_pending_review", "scored_pending_allocation", "allocation_pending_approval", "warranty"].includes(request.status)).length;

  return (
    <div className="min-h-full bg-white text-[#111827]">
      <header className="border-b border-[#244b91] bg-[#032a72] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-[#b8c6ff]"><ClipboardList className="h-4 w-4" /> AI PROJECT INTAKE</div>
              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">AI 项目需求与招募</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">需求从这里开始，经 AI 委员会评审后进入社区招募；团队确认后自动进入看板，结题积分审核后自动进入积分榜。</p>
            </div>
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 bg-[#4870ff] px-5 py-3 text-sm font-black text-white hover:bg-[#5b80ff]"><Plus className="h-4 w-4" /> 提交 AI 应用需求</summary>
              <form action={createAiRequest} className="absolute right-0 z-40 mt-2 max-h-[75vh] w-[min(94vw,780px)] space-y-4 overflow-y-auto border border-[#cbd5e6] bg-white p-5 text-[#111827] shadow-2xl sm:p-6">
                <div><label className={labelClass}>需求名称</label><input className={fieldClass} name="title" required maxLength={120} placeholder="用一句话说明希望建设的 AI 应用" /></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><label className={labelClass}>需求方姓名</label><input className={fieldClass} name="requesterName" required maxLength={50} /></div>
                  <div><label className={labelClass}>需求部门</label><input className={fieldClass} name="requesterDepartment" required maxLength={80} /></div>
                  <div><label className={labelClass}>企业邮箱</label><input className={fieldClass} name="requesterEmail" type="email" required maxLength={120} /></div>
                </div>
                <div><label className={labelClass}>业务背景</label><textarea className={fieldClass} name="background" required rows={3} maxLength={3000} placeholder="该需求产生于什么业务场景？" /></div>
                <div><label className={labelClass}>当前问题</label><textarea className={fieldClass} name="currentProblem" required rows={3} maxLength={3000} placeholder="目前的流程、效率或客户体验存在哪些问题？" /></div>
                <div><label className={labelClass}>希望实现的功能</label><textarea className={fieldClass} name="desiredFunctions" required rows={3} maxLength={3000} /></div>
                <div><label className={labelClass}>预期业务价值</label><textarea className={fieldClass} name="businessValue" required rows={3} maxLength={3000} placeholder="对收入、效率、成本、质量或客户体验的影响" /></div>
                <div><label className={labelClass}>预期交付成果</label><textarea className={fieldClass} name="expectedDeliverables" required rows={2} maxLength={2000} placeholder="系统、原型、报告、接口或其他成果" /></div>
                <div><label className={labelClass}>建议招募岗位与能力要求</label><textarea className={fieldClass} name="recruitmentRoles" required rows={3} maxLength={2000} placeholder="如：项目主导人 1 名；Agent 开发 2 名；业务顾问 1 名" /></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><label className={labelClass}>期望完成日期</label><input className={fieldClass} name="targetDate" type="date" /></div>
                  <div><label className={labelClass}>每周预计投入</label><input className={fieldClass} name="weeklyCommitment" maxLength={500} placeholder="如：每人每周 4 小时" /></div>
                  <div><label className={labelClass}>数据敏感级别</label><select className={fieldClass} name="dataSensitivity" defaultValue="internal"><option value="public">公开数据</option><option value="internal">公司内部数据</option><option value="sensitive">敏感/受限数据</option></select></div>
                </div>
                <div><label className={labelClass}>可提供的数据与业务资源</label><textarea className={fieldClass} name="availableResources" rows={2} maxLength={2000} /></div>
                <button className="w-full bg-[#4870ff] px-4 py-3 text-sm font-black text-white hover:bg-[#5b80ff]" type="submit">提交需求，进入委员会评审</button>
              </form>
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
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="AI 项目需求列表">
            {requests.map((request) => {
              const status = requestStatusMeta[request.status as AiRequestStatus] ?? requestStatusMeta.pending_review;
              return (
                <Link key={request.id} href={`/ai-requests/${request.id}`} className="group flex min-h-[280px] flex-col border border-[#d8e0ee] bg-white p-5 shadow-[0_4px_18px_rgba(3,42,114,0.045)] hover:border-[#4870ff]">
                  <div className="flex items-start justify-between gap-3"><span className={`inline-flex border px-2.5 py-1 text-[10px] font-black ${status.tone}`}>{status.label}</span><span className="font-mono text-[10px] text-[#9aa6ba]">{formatProjectDate(request.createdAt)}</span></div>
                  <h3 className="mt-5 text-xl font-black leading-snug group-hover:text-[#032a72]">{request.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#52627d] line-clamp-3">{request.businessValue}</p>
                  <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[#e2e8f2] pt-4 text-xs text-[#52627d]"><span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{request.requesterDepartment}</span><span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{request.requesterEmail}</span><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />报名 {request._count.applications}</span><span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />积分包 {request.basePointPool?.toLocaleString("zh-CN") ?? "待评审"}</span></div>
                </Link>
              );
            })}
          </section>
        ) : (
          <div className="mt-6 border border-dashed border-[#cbd5e6] bg-[#fafbfd] py-20 text-center"><ClipboardList className="mx-auto h-10 w-10 text-[#4870ff]" /><h3 className="mt-4 text-xl font-black">还没有 AI 应用需求</h3><p className="mt-2 text-sm text-[#6b7890]">点击页面右上角提交第一条需求。</p></div>
        )}
      </main>
    </div>
  );
}
