import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  advanceProjectStage, completeWarranty, confirmTeam,
  proposePointAllocation, reviewAndPublish, scoreProject, submitApplication,
  updateApplicationStatus, updateCommitteeAssistant,
} from "../actions";
import {
  applicationStatusMeta, formatProjectDate, requestStatusMeta, requestStatuses,
  committeeAssistants, effectCoefficientOptions, type AiRequestStatus,
} from "@/lib/ai-project-workflow";
import {
  ArrowLeft, ArrowRight, Award, Building2, CheckCircle2,
  ClipboardCheck, Clock3, Download, ExternalLink, FileText, Mail, Paperclip, Send,
  Target, UserCheck, Users,
} from "lucide-react";
import PointAllocationForm from "./PointAllocationForm";
import { attachmentSchema, type Attachment } from "@/lib/validators";
import { inferRatioTenths } from "@/lib/ai-point-allocation";

export const dynamic = "force-dynamic";

const fieldClass = "w-full border border-[#cbd5e6] bg-white px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#8491a8] focus:border-[#4870ff] focus:outline-none focus:ring-1 focus:ring-[#4870ff]";
const labelClass = "mb-1.5 block text-xs font-bold text-[#52627d]";
const panelClass = "border border-[#d8e0ee] bg-white p-5 sm:p-6";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const request = await prisma.aiDemandRequest.findUnique({ where: { id }, select: { title: true, businessValue: true } });
  return request ? { title: `${request.title} - AI 项目流程 - Medbot`, description: request.businessValue } : { title: "AI 项目未找到" };
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><dt className="mb-1.5 text-sm font-black leading-6 text-[#032a72]">{title}</dt><dd className="whitespace-pre-wrap text-sm leading-6 text-[#4f5f78]">{children}</dd></div>;
}

function parseAttachments(raw: string): Attachment[] {
  if (!raw) return [];
  try {
    const parsed = attachmentSchema.array().safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function formatAttachmentSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function LinkedText({ value }: { value: string }) {
  const parts = value.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => part.startsWith("http://") || part.startsWith("https://")
    ? <a key={`${part}-${index}`} href={part} target="_blank" rel="noopener noreferrer" className="break-all font-bold text-[#032a72] underline decoration-[#4870ff] underline-offset-2 hover:text-[#4870ff]">{part}</a>
    : part);
}

function StageAction({ title, description, action, button }: { title: string; description: string; action: (formData: FormData) => void | Promise<void>; button: string }) {
  return (
    <form action={action} className={`${panelClass} space-y-4`}>
      <div><h3 className="text-lg font-black">{title}</h3><p className="mt-1 text-sm leading-6 text-[#6b7890]">{description}</p></div>
      <div><label className={labelClass}>操作人</label><input className={fieldClass} name="actor" required maxLength={80} placeholder="项目负责人或需求方姓名" /></div>
      <button className="inline-flex items-center gap-2 bg-[#4870ff] px-4 py-2.5 text-sm font-black text-white hover:bg-[#5b80ff]" type="submit">{button}<ArrowRight className="h-4 w-4" /></button>
    </form>
  );
}

export default async function AiRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await prisma.aiDemandRequest.findUnique({
    where: { id },
    include: {
      activityPost: true,
      project: true,
      applications: { orderBy: { createdAt: "asc" } },
      teamMembers: { include: { allocation: true }, orderBy: [{ isLead: "desc" }, { createdAt: "asc" }] },
      logs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!request) notFound();

  const status = requestStatusMeta[request.status as AiRequestStatus] ?? requestStatusMeta.pending_review;
  const currentIndex = requestStatuses.indexOf(request.status as AiRequestStatus);
  const selectedApplications = request.applications.filter((application) => application.status === "selected");
  const projectLead = request.teamMembers.find((member) => member.isLead);
  const attachments = parseAttachments(request.attachments);
  const currentAllocationRatios = inferRatioTenths(
    request.finalPointPool ?? 0,
    request.teamMembers
      .filter((member) => member.allocation)
      .map((member) => ({
        key: member.id,
        proposedPoints: member.allocation!.proposedPoints,
        ratioTenths: member.allocation!.ratioTenths,
      })),
  );

  return (
    <div className="min-h-full bg-[#f7f9fc] text-[#111827]">
      <header className="border-b border-[#244b91] bg-[#032a72] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Link href="/ai-requests" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-white/65 hover:text-white"><ArrowLeft className="h-4 w-4" />返回需求与招募</Link>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div><span className={`inline-flex border px-2.5 py-1 text-[10px] font-black ${status.tone}`}>{status.label}</span><h1 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.035em] sm:text-5xl">{request.title}</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">{status.description}</p></div>
            <div className="grid min-w-[280px] grid-cols-2 border border-white/20 text-sm"><div className="border-r border-white/20 p-4"><p className="text-xs text-white/50">项目等级</p><strong className="mt-1 block text-xl">{request.projectLevel ? `${request.projectLevel} 级` : "待评审"}</strong></div><div className="p-4"><p className="text-xs text-white/50">基础积分总包</p><strong className="mt-1 block text-xl">{request.basePointPool?.toLocaleString("zh-CN") ?? "待评审"}</strong></div></div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="mb-8 overflow-x-auto border border-[#d8e0ee] bg-white p-4" aria-label="项目流程进度">
          <ol className="flex min-w-[980px] items-start">
            {requestStatuses.map((stage, index) => {
              const meta = requestStatusMeta[stage];
              const completed = currentIndex >= index;
              return <li key={stage} className="relative flex-1 text-center before:absolute before:left-0 before:right-0 before:top-3 before:h-px before:bg-[#d8e0ee] first:before:left-1/2 last:before:right-1/2"><span className={`relative mx-auto flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-black ${completed ? "border-[#4870ff] bg-[#4870ff] text-white" : "border-[#cbd5e6] bg-white text-[#8491a8]"}`}>{completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}</span><span className={`mt-2 block px-1 text-[10px] font-bold ${completed ? "text-[#032a72]" : "text-[#8491a8]"}`}>{meta.label}</span></li>;
            })}
          </ol>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.65fr_0.75fr]">
          <div className="space-y-6">
            <section className={panelClass}>
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[0.18em] text-[#032a72]">REQUIREMENT BRIEF</p><h2 className="mt-2 text-2xl font-black">需求说明</h2></div>{request.activityPost && <Link href={`/activities/${request.activityPost.slug}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#032a72]">查看社区招募活动<ExternalLink className="h-4 w-4 text-[#4870ff]" /></Link>}</div>
              <dl className="mt-6 grid gap-5 sm:grid-cols-2"><DetailBlock title="业务背景">{request.background}</DetailBlock><DetailBlock title="当前问题">{request.currentProblem}</DetailBlock><DetailBlock title="希望实现的功能">{request.desiredFunctions}</DetailBlock><DetailBlock title="预期业务价值">{request.businessValue}</DetailBlock><DetailBlock title="预期交付成果">{request.expectedDeliverables}</DetailBlock><DetailBlock title="招募岗位与能力要求">{request.recruitmentRoles}</DetailBlock><DetailBlock title="可提供资源">{request.availableResources ? <LinkedText value={request.availableResources} /> : "待补充"}</DetailBlock><DetailBlock title="每周预计投入">{request.weeklyCommitment || "待团队确认"}</DetailBlock></dl>
              {attachments.length > 0 && <div className="mt-6 border-t border-[#d8e0ee] pt-5"><h3 className="flex items-center gap-2 text-sm font-black text-[#032a72]"><Paperclip className="h-4 w-4" />需求附件（{attachments.length}）</h3><ul className="mt-3 grid gap-2 sm:grid-cols-2">{attachments.map((attachment) => <li key={attachment.url}><a href={attachment.url} download={attachment.name} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 border border-[#d8e0ee] bg-[#fafbfd] px-3 py-2.5 hover:border-[#4870ff] hover:bg-[#f2f5ff]"><FileText className="h-4 w-4 shrink-0 text-[#6b7890] group-hover:text-[#4870ff]" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#34445e]">{attachment.name}</span><span className="block text-[10px] text-[#8491a8]">{formatAttachmentSize(attachment.size)}</span></span><Download className="h-4 w-4 shrink-0 text-[#8491a8] group-hover:text-[#4870ff]" /></a></li>)}</ul></div>}
            </section>

            {request.status === "pending_review" && (
              <form action={reviewAndPublish.bind(null, id)} className={`${panelClass} space-y-4`}>
                <div><p className="font-mono text-[10px] tracking-[0.18em] text-[#032a72]">AI DEVELOPMENT COMMITTEE REVIEW</p><h2 className="mt-2 text-2xl font-black">AI发展委员会评审并发布招募</h2><p className="mt-2 text-sm leading-6 text-[#6b7890]">评审通过后将立即生成一篇社区活动，并开放员工报名。</p></div>
                <div className="grid gap-3 sm:grid-cols-3"><div><label className={labelClass}>AI 项目等级</label><select className={fieldClass} name="projectLevel" defaultValue="3">{[1,2,3,4,5].map((level) => <option key={level} value={level}>{level} 级项目</option>)}</select></div><div><label className={labelClass}>基础积分总包</label><input className={fieldClass} name="basePointPool" type="number" min="1" required /></div><div><label className={labelClass}>计划团队人数</label><input className={fieldClass} name="plannedTeamSize" type="number" min="1" defaultValue="3" required /></div></div>
                <div className="grid gap-3 sm:grid-cols-3"><div><label className={labelClass}>报名截止日期</label><input className={fieldClass} name="recruitmentDeadline" type="date" required /></div><div><label className={labelClass}>质保期（月）</label><input className={fieldClass} name="warrantyMonths" type="number" min="1" max="24" defaultValue="3" required /></div><div><label className={labelClass}>评审人</label><input className={fieldClass} name="reviewedBy" required maxLength={80} defaultValue="AI发展委员会" /></div></div>
                <div><label className={labelClass}>AI发展委员会协助人</label><select className={fieldClass} name="committeeAssistant" required defaultValue=""><option value="" disabled>请选择协助项目协调资源的委员会成员</option>{committeeAssistants.map((member) => <option key={member} value={member}>{member}</option>)}</select></div>
                <div><label className={labelClass}>评审意见</label><textarea className={fieldClass} name="reviewComment" required rows={3} maxLength={2000} placeholder="请填写评审依据，如：同意发布" /></div>
                <button className="inline-flex items-center gap-2 bg-[#4870ff] px-5 py-3 text-sm font-black text-white hover:bg-[#5b80ff]" type="submit"><Send className="h-4 w-4" />通过评审并发布社区招募</button>
              </form>
            )}

            {request.status === "recruiting" && (
              <>
                <form action={submitApplication.bind(null, id)} className={`${panelClass} space-y-4`}>
                  <div><p className="font-mono text-[10px] tracking-[0.18em] text-[#032a72]">JOIN THE PROJECT</p><h2 className="mt-2 text-2xl font-black">报名参与项目</h2><p className="mt-2 text-sm text-[#6b7890]">报名截止：{formatProjectDate(request.recruitmentDeadline)}</p></div>
                  <div className="grid gap-3 sm:grid-cols-3"><div><label className={labelClass}>姓名</label><input className={fieldClass} name="name" required maxLength={50} /></div><div><label className={labelClass}>部门</label><input className={fieldClass} name="department" required maxLength={80} /></div><div><label className={labelClass}>企业邮箱</label><input className={fieldClass} name="email" type="email" required maxLength={120} /></div></div>
                  <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass}>意向岗位</label><input className={fieldClass} name="intendedRole" required maxLength={100} /></div><div><label className={labelClass}>每周可投入时间</label><input className={fieldClass} name="weeklyAvailability" required maxLength={200} /></div></div>
                  <div><label className={labelClass}>相关技能与项目经验</label><textarea className={fieldClass} name="skills" required rows={3} maxLength={2000} /></div><div><label className={labelClass}>报名说明</label><textarea className={fieldClass} name="statement" rows={2} maxLength={2000} /></div>
                  <button className="inline-flex items-center gap-2 bg-[#4870ff] px-5 py-3 text-sm font-black text-white hover:bg-[#5b80ff]" type="submit"><UserCheck className="h-4 w-4" />提交报名</button>
                </form>

                <section className={panelClass}>
                  <div className="flex items-end justify-between"><div><h2 className="text-2xl font-black">报名筛选</h2><p className="mt-1 text-sm text-[#6b7890]">共 {request.applications.length} 人报名，已入选 {selectedApplications.length} 人。</p></div><Users className="h-6 w-6 text-[#4870ff]" /></div>
                  {request.applications.length > 0 ? <div className="mt-5 divide-y divide-[#e2e8f2] border-t border-[#e2e8f2]">{request.applications.map((application) => {
                    const applicationMeta = applicationStatusMeta[application.status as keyof typeof applicationStatusMeta] ?? applicationStatusMeta.pending;
                    return <article key={application.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{application.name} <span className={`ml-2 px-2 py-0.5 text-[10px] ${applicationMeta.tone}`}>{applicationMeta.label}</span></h3><p className="mt-1 text-xs text-[#6b7890]">{application.department} · {application.email} · {application.intendedRole} · 每周 {application.weeklyAvailability}</p><p className="mt-2 text-sm leading-6 text-[#52627d]">{application.skills}</p></div><div className="flex flex-wrap gap-1">{(["selected", "reserve", "rejected", "pending"] as const).map((nextStatus) => <form key={nextStatus} action={updateApplicationStatus.bind(null, application.id, id, nextStatus)}><button className="border border-[#cbd5e6] px-2.5 py-1.5 text-[10px] font-bold text-[#52627d] hover:border-[#4870ff] hover:text-[#032a72]" type="submit">{applicationStatusMeta[nextStatus].label}</button></form>)}</div></div></article>;
                  })}</div> : <p className="mt-6 border border-dashed border-[#cbd5e6] py-10 text-center text-sm text-[#6b7890]">暂时还没有报名记录。</p>}
                </section>

                {selectedApplications.length > 0 && (
                  <form action={confirmTeam.bind(null, id)} className={`${panelClass} space-y-4`}><div><h2 className="text-2xl font-black">确认项目团队</h2><p className="mt-1 text-sm leading-6 text-[#6b7890]">确认后将自动创建 AI 看板项目，并关闭本轮招募。</p></div><div><label className={labelClass}>指定项目负责人</label><select className={fieldClass} name="leadApplicationId" required defaultValue=""><option value="" disabled>请选择已入选成员</option>{selectedApplications.map((application) => <option key={application.id} value={application.id}>{application.name} · {application.department} · {application.intendedRole}</option>)}</select></div><button className="inline-flex items-center gap-2 bg-[#032a72] px-5 py-3 text-sm font-black text-white hover:bg-[#0d3d88]" type="submit"><Users className="h-4 w-4" />确认团队并进入 AI 看板</button></form>
                )}
              </>
            )}

            {request.status === "team_confirmed" && <StageAction title="启动项目开发" description="团队确认后，由项目负责人正式启动开发。" action={advanceProjectStage.bind(null, id, "developing")} button="进入开发阶段" />}
            {request.status === "developing" && <StageAction title="提交试用评估" description="核心功能完成后，将产品交给需求方进行试用和效果验证。" action={advanceProjectStage.bind(null, id, "trial")} button="进入试用评估" />}
            {request.status === "trial" && <StageAction title="提交项目交付" description="需求方完成试用确认后提交交付，等待 AI发展委员会结题评审。" action={advanceProjectStage.bind(null, id, "delivered_pending_review")} button="确认交付并申请结题评审" />}

            {request.status === "delivered_pending_review" && (
              <form action={scoreProject.bind(null, id)} className={`${panelClass} space-y-5`}>
                <div><p className="font-mono text-[10px] tracking-[0.18em] text-[#032a72]">FINAL REVIEW</p><h2 className="mt-2 text-2xl font-black">AI发展委员会结题评审</h2><p className="mt-2 text-sm leading-6 text-[#6b7890]">AI发展委员会按激励政策直接确定成效系数；系统据此计算最终积分总包。</p></div>
                <fieldset className="border border-[#d8e0ee] bg-[#fafbfd] p-4"><legend className="px-2 text-sm font-black">主要负责人信息</legend><div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass}>姓名</label><input className={fieldClass} name="leadName" required maxLength={50} defaultValue={projectLead?.name ?? request.project?.owner ?? ""} /></div><div><label className={labelClass}>部门</label><input className={fieldClass} name="leadDepartment" required maxLength={80} defaultValue={projectLead?.department ?? ""} /></div><div><label className={labelClass}>企业邮箱</label><input className={fieldClass} name="leadEmail" type="email" required maxLength={120} defaultValue={projectLead?.email ?? ""} /></div><div><label className={labelClass}>项目角色</label><input className={fieldClass} name="leadRole" required maxLength={100} defaultValue={projectLead?.role ?? "项目负责人"} /></div></div></fieldset>
                <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass}>成效系数</label><select className={fieldClass} name="effectCoefficient" required defaultValue=""><option value="" disabled>请选择激励政策分档</option>{effectCoefficientOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><div><label className={labelClass}>评审人</label><input className={fieldClass} name="reviewedBy" required maxLength={80} defaultValue="AI发展委员会" /></div></div>
                <div><label className={labelClass}>结题评语</label><textarea className={fieldClass} name="comment" required rows={3} maxLength={2000} /></div><button className="inline-flex items-center gap-2 bg-[#4870ff] px-5 py-3 text-sm font-black text-white"><ClipboardCheck className="h-4 w-4" />确认成效系数并计算最终积分</button>
              </form>
            )}

            {request.status === "scored_pending_allocation" && (
              <PointAllocationForm action={proposePointAllocation.bind(null, id)} members={request.teamMembers.map(({ id: memberId, name, department, email, role, isLead }) => ({ id: memberId, name, department, email, role, isLead }))} finalPointPool={request.finalPointPool!} defaultProposer={projectLead?.name ?? request.project?.owner ?? ""} />
            )}

            {request.status === "warranty" && (
              <>
                <PointAllocationForm
                  key={request.teamMembers.map((member) => member.id).join("|")}
                  action={proposePointAllocation.bind(null, id)}
                  members={request.teamMembers.map(({ id: memberId, name, department, email, role, isLead }) => ({ id: memberId, name, department, email, role, isLead }))}
                  finalPointPool={request.finalPointPool!}
                  defaultProposer={request.pointsApprovedBy || projectLead?.name || request.project?.owner || ""}
                  initialRatios={currentAllocationRatios}
                  defaultAllocationNote={request.allocationNote}
                  isRevision
                />
                <form action={completeWarranty.bind(null, id)} className={`${panelClass} space-y-4`}><div><h2 className="text-2xl font-black">完成质保并发放剩余积分</h2><p className="mt-2 text-sm text-[#6b7890]">首期积分已进入榜单。质保期为 {request.warrantyMonths} 个月；如需调整个人比例，请先在上方保存修改。确认质保结束后发放剩余积分，项目结题后分配将不能再修改。</p></div><div><label className={labelClass}>AI发展委员会确认人</label><input className={fieldClass} name="actor" required maxLength={80} /></div><button className="inline-flex items-center gap-2 bg-[#4870ff] px-5 py-3 text-sm font-black text-white"><Award className="h-4 w-4" />完成质保并正式结题</button></form>
              </>
            )}

            {request.status === "completed" && <div className={`${panelClass} border-l-4 border-l-[#35a762]`}><CheckCircle2 className="h-8 w-8 text-[#35a762]" /><h2 className="mt-4 text-2xl font-black">项目已完成全部流程</h2><p className="mt-2 text-sm leading-6 text-[#52627d]">项目已结题，100% 积分发放完成并进入 AI 积分榜。</p><Link href="/ai-points" className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#032a72]">查看 AI 积分榜<ArrowRight className="h-4 w-4 text-[#4870ff]" /></Link></div>}
          </div>

          <aside className="space-y-6">
            <section className={panelClass}><h2 className="text-lg font-black">需求方信息</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#4870ff]" /><span>{request.requesterDepartment}</span></div><div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-[#4870ff]" /><span>{request.requesterName}</span></div><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#4870ff]" /><a href={`mailto:${request.requesterEmail}`} className="break-all text-[#032a72] hover:underline">{request.requesterEmail}</a></div><div className="flex items-center gap-2"><Target className="h-4 w-4 text-[#4870ff]" /><span>期望完成：{formatProjectDate(request.targetDate)}</span></div></dl></section>

            <section className={panelClass}>
              <h2 className="text-lg font-black">AI发展委员会协助人</h2>
              <p className="mt-2 text-sm leading-6 text-[#6b7890]">协助项目负责人协调所需资源。</p>
              {request.status === "pending_review" ? (
                <p className="mt-4 border border-dashed border-[#cbd5e6] bg-[#fafbfd] px-3 py-3 text-sm font-bold text-[#6b7890]">待评审时指定</p>
              ) : (
                <form action={updateCommitteeAssistant.bind(null, id)} className="mt-4 space-y-3">
                  <select className={fieldClass} name="committeeAssistant" required defaultValue={request.committeeAssistant}><option value="" disabled>请选择协助人</option>{committeeAssistants.map((member) => <option key={member} value={member}>{member}</option>)}</select>
                  <button className="w-full border border-[#4870ff] px-3 py-2 text-xs font-black text-[#032a72] hover:bg-[#4870ff] hover:text-white" type="submit">保存协助人</button>
                </form>
              )}
            </section>

            <section className={panelClass}><h2 className="text-lg font-black">评审与积分</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-[#6b7890]">项目等级</dt><dd className="font-black">{request.projectLevel ? `${request.projectLevel} 级` : "待评审"}</dd></div><div className="flex justify-between"><dt className="text-[#6b7890]">基础积分</dt><dd className="font-black">{request.basePointPool?.toLocaleString("zh-CN") ?? "待评审"}</dd></div><div className="flex justify-between"><dt className="text-[#6b7890]">成效系数</dt><dd className="font-black">{request.effectCoefficient ?? "待评审"}</dd></div><div className="flex justify-between border-t border-[#e2e8f2] pt-3"><dt className="text-[#6b7890]">最终积分</dt><dd className="font-black text-[#032a72]">{request.finalPointPool?.toLocaleString("zh-CN") ?? "待计算"}</dd></div></dl></section>

            {request.teamMembers.length > 0 && <section className={panelClass}><h2 className="text-lg font-black">项目团队</h2><ul className="mt-4 space-y-3">{request.teamMembers.map((member) => <li key={member.id} className="border-b border-[#e2e8f2] pb-3 last:border-0 last:pb-0"><div className="flex items-center justify-between gap-2"><strong className="text-sm">{member.name}</strong>{member.isLead && <span className="bg-[#e9efff] px-2 py-0.5 text-[10px] font-black text-[#032a72]">负责人</span>}</div><p className="mt-1 text-xs text-[#6b7890]">{member.department} · {member.role}</p></li>)}</ul></section>}

            <section className={panelClass}><h2 className="flex items-center gap-2 text-lg font-black"><Clock3 className="h-5 w-5 text-[#4870ff]" />公开流程记录</h2><ol className="mt-4 space-y-4">{request.logs.map((log) => <li key={log.id} className="border-l-2 border-[#d8e0ee] pl-3"><p className="text-sm font-bold">{log.action}</p><p className="mt-1 text-xs text-[#6b7890]">{formatProjectDate(log.createdAt)} · {log.actor}</p>{log.detail && <p className="mt-1 text-xs leading-5 text-[#8491a8]">{log.detail}</p>}</li>)}</ol></section>
          </aside>
        </div>
      </main>
    </div>
  );
}
