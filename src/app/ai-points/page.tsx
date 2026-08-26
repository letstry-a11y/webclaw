import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  ArrowRight, Award, ChevronDown, CircleDollarSign, FileCheck2,
  History, Medal, Pencil, Plus, ShieldCheck, Sparkles, Trophy, Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI 积分排名榜 - Medbot",
  description: "公开展示 AI 历史累计积分、AI 等级、项目经历与积分变更记录",
};
export const dynamic = "force-dynamic";

const levels = [
  { code: "L1", name: "AI 入门", points: "不设积分门槛", projects: "参与结题项目 ≥1" },
  { code: "L2", name: "AI 初级", points: "≥2,000", projects: "结题 ≥2，至少一个成效系数 ≥1" },
  { code: "L3", name: "AI 中级", points: "≥8,000", projects: "结题 ≥3，主导 ≥1" },
  { code: "L4", name: "AI 高级", points: "≥20,000", projects: "结题 ≥5，主导 ≥2" },
  { code: "L5", name: "AI 专家", points: "≥35,000", projects: "结题 ≥8，主导 ≥3，且高成效项目 ≥1" },
] as const;

type LevelCode = (typeof levels)[number]["code"];

const levelNames = Object.fromEntries(levels.map((level) => [level.code, level.name])) as Record<LevelCode, string>;
const levelSchema = z.enum(["L1", "L2", "L3", "L4", "L5"]);
const memberSchema = z.object({
  name: z.string().trim().min(1).max(50),
  department: z.string().trim().max(80),
  level: levelSchema,
  completedProjects: z.coerce.number().int().min(0).max(999),
  ledProjects: z.coerce.number().int().min(0).max(999),
  highImpactProjects: z.coerce.number().int().min(0).max(999),
});
const entrySchema = z.object({
  historicalDelta: z.coerce.number().int().min(-1000000).max(1000000),
  availableDelta: z.coerce.number().int().min(-1000000).max(1000000),
  reason: z.string().trim().min(1).max(200),
  projectName: z.string().trim().max(100),
  operatorName: z.string().trim().max(50).default("公开登记"),
});

const fieldClass = "w-full border border-[#cbd5e6] bg-white px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#8491a8] focus:border-[#4870ff] focus:outline-none focus:ring-1 focus:ring-[#4870ff]";
const labelClass = "mb-1.5 block text-xs font-bold text-[#52627d]";

function memberFromForm(formData: FormData) {
  return memberSchema.parse({
    name: formData.get("name"),
    department: formData.get("department") ?? "",
    level: formData.get("level"),
    completedProjects: formData.get("completedProjects") ?? 0,
    ledProjects: formData.get("ledProjects") ?? 0,
    highImpactProjects: formData.get("highImpactProjects") ?? 0,
  });
}

function refreshPoints() {
  revalidatePath("/");
  revalidatePath("/ai-points");
}

async function createMember(formData: FormData) {
  "use server";
  await prisma.aiPointMember.create({ data: memberFromForm(formData) });
  refreshPoints();
}

async function updateMember(memberId: string, formData: FormData) {
  "use server";
  await prisma.aiPointMember.update({ where: { id: memberId }, data: memberFromForm(formData) });
  refreshPoints();
}

async function addPointEntry(memberId: string, formData: FormData) {
  "use server";
  const entry = entrySchema.parse({
    historicalDelta: formData.get("historicalDelta") ?? 0,
    availableDelta: formData.get("availableDelta") ?? 0,
    reason: formData.get("reason"),
    projectName: formData.get("projectName") ?? "",
    operatorName: formData.get("operatorName") || "公开登记",
  });
  if (entry.historicalDelta === 0 && entry.availableDelta === 0) {
    throw new Error("至少填写一项积分变动");
  }

  await prisma.$transaction(async (tx) => {
    const member = await tx.aiPointMember.findUniqueOrThrow({ where: { id: memberId } });
    const historicalPoints = member.historicalPoints + entry.historicalDelta;
    const availablePoints = member.availablePoints + entry.availableDelta;
    if (historicalPoints < 0 || availablePoints < 0) {
      throw new Error("积分调整后不能小于 0");
    }
    await tx.aiPointMember.update({
      where: { id: memberId },
      data: { historicalPoints, availablePoints },
    });
    await tx.aiPointEntry.create({ data: { ...entry, memberId } });
  });
  refreshPoints();
}

function MemberFields({ member }: {
  member?: { name: string; department: string; level: string; completedProjects: number; ledProjects: number; highImpactProjects: number };
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={labelClass}>姓名</label><input className={fieldClass} name="name" defaultValue={member?.name} required maxLength={50} /></div>
        <div><label className={labelClass}>部门</label><input className={fieldClass} name="department" defaultValue={member?.department} maxLength={80} placeholder="可暂不填写" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className={labelClass}>委员会确认等级</label>
          <select className={fieldClass} name="level" defaultValue={member?.level ?? "L1"}>
            {levels.map((level) => <option key={level.code} value={level.code}>{level.code} · {level.name}</option>)}
          </select>
        </div>
        <div><label className={labelClass}>结题项目数</label><input className={fieldClass} name="completedProjects" type="number" min="0" defaultValue={member?.completedProjects ?? 0} /></div>
        <div><label className={labelClass}>主导项目数</label><input className={fieldClass} name="ledProjects" type="number" min="0" defaultValue={member?.ledProjects ?? 0} /></div>
        <div><label className={labelClass}>高成效项目数</label><input className={fieldClass} name="highImpactProjects" type="number" min="0" defaultValue={member?.highImpactProjects ?? 0} /></div>
      </div>
    </>
  );
}

function formatPoints(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

export default async function AiPointsPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const params = await searchParams;
  const activeLevel = levelSchema.safeParse(params.level).success ? params.level as LevelCode : "ALL";
  const members = await prisma.aiPointMember.findMany({
    orderBy: [{ historicalPoints: "desc" }, { updatedAt: "asc" }],
    include: { entries: { orderBy: { createdAt: "desc" }, take: 5 } },
  });
  const rankedMembers = activeLevel === "ALL" ? members : members.filter((member) => member.level === activeLevel);
  const totalHistorical = members.reduce((sum, member) => sum + member.historicalPoints, 0);
  const completedProjects = members.reduce((sum, member) => sum + member.completedProjects, 0);
  const lastUpdated = members.reduce<Date | null>((latest, member) => !latest || member.updatedAt > latest ? member.updatedAt : latest, null);

  return (
    <div className="min-h-full bg-white text-[#111827]">
      <header className="border-b border-[#244b91] bg-[#032a72] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-[#b8c6ff]"><Trophy className="h-4 w-4" /> MEDBOT AI POINTS</div>
              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">AI 积分排名榜</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">公开展示员工在 AI 应用项目中的历史贡献、委员会认定等级和积分变更记录。</p>
            </div>
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 bg-[#4870ff] px-5 py-3 text-sm font-black text-white hover:bg-[#5b80ff]"><Plus className="h-4 w-4" /> 新增积分成员</summary>
              <form action={createMember} className="absolute right-0 z-30 mt-2 w-[min(92vw,720px)] space-y-4 border border-[#cbd5e6] bg-white p-5 text-[#111827] shadow-2xl">
                <MemberFields />
                <p className="text-xs leading-5 text-[#6b7890]">新增成员初始积分为 0，积分必须通过公开变更记录发放。</p>
                <button className="w-full bg-[#4870ff] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#5b80ff]" type="submit">创建成员</button>
              </form>
            </details>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="grid border border-[#d8e0ee] bg-[#f7f9fc] sm:grid-cols-2 lg:grid-cols-4" aria-label="积分数据概览">
          <div className="border-b border-[#d8e0ee] p-5 sm:border-r lg:border-b-0"><Users className="h-5 w-5 text-[#4870ff]" /><p className="mt-3 text-xs font-bold text-[#6b7890]">参与人数</p><strong className="mt-1 block text-3xl font-black">{members.length}</strong></div>
          <div className="border-b border-[#d8e0ee] p-5 lg:border-b-0 lg:border-r"><CircleDollarSign className="h-5 w-5 text-[#4870ff]" /><p className="mt-3 text-xs font-bold text-[#6b7890]">历史累计积分</p><strong className="mt-1 block text-3xl font-black">{formatPoints(totalHistorical)}</strong></div>
          <div className="border-b border-[#d8e0ee] p-5 sm:border-b-0 sm:border-r"><FileCheck2 className="h-5 w-5 text-[#4870ff]" /><p className="mt-3 text-xs font-bold text-[#6b7890]">结题项目记录</p><strong className="mt-1 block text-3xl font-black">{completedProjects}</strong></div>
          <div className="p-5"><History className="h-5 w-5 text-[#4870ff]" /><p className="mt-3 text-xs font-bold text-[#6b7890]">最近更新</p><strong className="mt-2 block text-base font-black">{lastUpdated ? formatDate(lastUpdated) : "待公示"}</strong></div>
        </section>

        <section className="mt-12" aria-label="积分排行榜">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-black pb-3">
            <div><h2 className="text-3xl font-black tracking-[-0.03em]">积分排行</h2><p className="mt-1 text-xs text-[#6b7890]">按历史累计积分排序；兑换不会扣减历史积分。</p></div>
            <div className="flex flex-wrap gap-1">
              {["ALL", ...levels.map((level) => level.code)].map((level) => {
                const active = activeLevel === level;
                return <Link key={level} href={level === "ALL" ? "/ai-points" : `/ai-points?level=${level}`} className={`px-3 py-2 text-xs font-bold ${active ? "bg-[#032a72] text-white" : "border border-[#d8e0ee] text-[#52627d] hover:border-[#4870ff]"}`}>{level === "ALL" ? "全员榜" : level}</Link>;
              })}
            </div>
          </div>

          {rankedMembers.length > 0 ? (
            <div className="divide-y divide-[#d8e0ee] border-b border-[#d8e0ee]">
              {rankedMembers.map((member, index) => {
                const level = levelSchema.safeParse(member.level).success ? member.level as LevelCode : "L1";
                return (
                  <article key={member.id} className="py-5">
                    <div className="grid items-center gap-4 md:grid-cols-[68px_1.3fr_0.8fr_0.8fr_0.8fr_auto]">
                      <div className="font-mono text-3xl font-black text-[#032a72]">{String(index + 1).padStart(2, "0")}</div>
                      <div><h3 className="text-lg font-black">{member.name}</h3><p className="mt-1 text-xs text-[#6b7890]">{member.department || "部门待补充"}</p></div>
                      <div><span className="inline-flex bg-[#e9efff] px-2.5 py-1 text-xs font-black text-[#032a72]">{level} · {levelNames[level]}</span></div>
                      <div><p className="text-xs text-[#6b7890]">历史累计</p><strong className="mt-1 block text-lg font-black">{formatPoints(member.historicalPoints)} 分</strong></div>
                      <div><p className="text-xs text-[#6b7890]">当前可用</p><strong className="mt-1 block text-lg font-black">{formatPoints(member.availablePoints)} 分</strong></div>
                      <div className="text-right text-xs leading-5 text-[#52627d]">结题 {member.completedProjects}<br />主导 {member.ledProjects}</div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <details className="group border border-[#d8e0ee]">
                        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold text-[#032a72]"><span className="flex items-center gap-1.5"><Pencil className="h-3.5 w-3.5" /> 编辑成员档案</span><ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
                        <form action={updateMember.bind(null, member.id)} className="space-y-4 border-t border-[#d8e0ee] p-4"><MemberFields member={member} /><button className="w-full border border-[#4870ff] px-4 py-2 text-xs font-bold text-[#032a72] hover:bg-[#4870ff] hover:text-white">保存档案</button></form>
                      </details>
                      <details className="group border border-[#d8e0ee]">
                        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold text-[#032a72]"><span className="flex items-center gap-1.5"><CircleDollarSign className="h-3.5 w-3.5" /> 登记积分变动</span><ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
                        <form action={addPointEntry.bind(null, member.id)} className="space-y-3 border-t border-[#d8e0ee] p-4">
                          <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass}>历史积分变动</label><input className={fieldClass} name="historicalDelta" type="number" defaultValue="0" /><p className="mt-1 text-[11px] text-[#8491a8]">项目发放时填写；兑换时保持 0</p></div><div><label className={labelClass}>可用积分变动</label><input className={fieldClass} name="availableDelta" type="number" defaultValue="0" /><p className="mt-1 text-[11px] text-[#8491a8]">发放填正数，兑换填负数</p></div></div>
                          <div><label className={labelClass}>变动原因</label><input className={fieldClass} name="reason" required maxLength={200} placeholder="如：项目交付发放 70% 积分" /></div>
                          <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass}>关联项目</label><input className={fieldClass} name="projectName" maxLength={100} /></div><div><label className={labelClass}>登记人</label><input className={fieldClass} name="operatorName" maxLength={50} placeholder="公开登记" /></div></div>
                          <button className="w-full bg-[#4870ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#5b80ff]">确认登记并生成记录</button>
                        </form>
                      </details>
                    </div>

                    {member.entries.length > 0 && (
                      <div className="mt-3 bg-[#f7f9fc] px-4 py-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-[#52627d]"><History className="h-3.5 w-3.5" /> 最近积分记录</p>
                        <ul className="space-y-2 text-xs text-[#52627d]">{member.entries.map((entry) => <li key={entry.id} className="flex flex-wrap justify-between gap-2"><span>{formatDate(entry.createdAt)} · {entry.reason}{entry.projectName ? ` · ${entry.projectName}` : ""}</span><strong className="text-[#032a72]">历史 {entry.historicalDelta >= 0 ? "+" : ""}{entry.historicalDelta} / 可用 {entry.availableDelta >= 0 ? "+" : ""}{entry.availableDelta}</strong></li>)}</ul>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-[#cbd5e6] bg-[#fafbfd] py-16 text-center">
              <Medal className="mx-auto h-10 w-10 text-[#4870ff]" />
              <h3 className="mt-4 text-xl font-black">积分数据待委员会公示</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6b7890]">当前不展示虚构排名。首批人员及积分确认后，可通过本页“新增积分成员”和“登记积分变动”直接公开录入。</p>
            </div>
          )}
        </section>

        <section className="mt-14" aria-label="AI 等级规则">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-black pb-3"><div><h2 className="text-3xl font-black tracking-[-0.03em]">AI 等级规则</h2><p className="mt-1 text-xs text-[#6b7890]">等级同时考察历史累计积分和已结题项目经历。</p></div><Link href="/posts/ai-application-project-incentive-policy" className="inline-flex items-center gap-1 text-sm font-bold text-[#032a72]">查看完整激励政策 <ArrowRight className="h-4 w-4 text-[#4870ff]" /></Link></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {levels.map((level, index) => (
              <article key={level.code} className="border border-[#d8e0ee] p-5">
                <div className="flex items-center justify-between"><span className="font-mono text-2xl font-black text-[#032a72]">{level.code}</span>{index === levels.length - 1 ? <Award className="h-5 w-5 text-[#4870ff]" /> : <Sparkles className="h-4 w-4 text-[#9eb3ff]" />}</div>
                <h3 className="mt-4 text-lg font-black">{level.name}</h3><p className="mt-3 text-sm font-bold text-[#032a72]">{level.points}</p><p className="mt-2 text-xs leading-5 text-[#6b7890]">{level.projects}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-3 border-l-4 border-[#4870ff] bg-[#eef3fb] p-4 text-sm leading-6 text-[#34445e]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#032a72]" /><p><strong>口径说明：</strong>历史累计积分用于排名和等级认定，兑换后不扣减；当前可用积分用于按 1:1 兑换 Token、VPN 或其他 AI 工具费用。等级由 AI 发展委员会结合积分与项目经历确认。</p></div>
        </section>
      </main>
    </div>
  );
}
