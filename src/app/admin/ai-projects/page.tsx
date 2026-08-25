import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  ArrowRight, BrainCircuit, CalendarClock, Check, CheckCircle2, ChevronDown,
  CircleDot, Clock3, Database, ExternalLink, Pencil, Plus, Search,
  ShoppingCart, Smartphone, Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

const projectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  subtitle: z.string().trim().max(200),
  status: z.enum(["planning", "evaluating", "delivered", "launched"]),
});
const progressSchema = z.string().trim().min(1).max(500);
const actionSchema = z.object({
  task: z.string().trim().min(1).max(500),
  owner: z.string().trim().min(1).max(50),
  dueDate: z.string().date(),
});

const statusMeta = {
  planning: { label: "规划中", className: "border-[#cfd4cc] bg-[#f3f5f1] text-[#50564d]" },
  evaluating: { label: "试用评估", className: "border-[#e9bd71] bg-[#fff7e8] text-[#8a5700]" },
  delivered: { label: "已交付", className: "border-[#9ac45a] bg-[#f1f8e8] text-[#416700]" },
  launched: { label: "已上线", className: "border-[#7dc89a] bg-[#edf9f1] text-[#13743a]" },
} as const;

const fieldClass = "w-full border border-[#cfd4cc] bg-white px-3 py-2.5 text-sm text-[#111411] placeholder:text-[#8b9287] focus:border-[#76b900] focus:outline-none focus:ring-1 focus:ring-[#76b900]";
const labelClass = "mb-1.5 block text-xs font-medium text-[#50564d]";

function refreshDashboard() {
  revalidatePath("/ai-projects");
  revalidatePath("/admin/ai-projects");
}

async function createProject(formData: FormData) {
  "use server";
  const project = projectSchema.parse({
    name: formData.get("name"),
    subtitle: formData.get("subtitle") ?? "",
    status: formData.get("status"),
  });
  const progress = progressSchema.safeParse(formData.get("progress"));
  const lastProject = await prisma.aiProject.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  await prisma.aiProject.create({
    data: {
      ...project,
      order: (lastProject?.order ?? 0) + 1,
      progress: progress.success ? { create: { content: progress.data } } : undefined,
    },
  });
  refreshDashboard();
}

async function updateProject(projectId: string, formData: FormData) {
  "use server";
  const project = projectSchema.parse({
    name: formData.get("name"),
    subtitle: formData.get("subtitle") ?? "",
    status: formData.get("status"),
  });
  await prisma.aiProject.update({ where: { id: projectId }, data: project });
  refreshDashboard();
}

async function addProgress(projectId: string, formData: FormData) {
  "use server";
  const content = progressSchema.parse(formData.get("content"));
  await prisma.aiProjectProgress.create({ data: { projectId, content } });
  refreshDashboard();
}

async function addAction(projectId: string, formData: FormData) {
  "use server";
  const action = actionSchema.parse({
    task: formData.get("task"), owner: formData.get("owner"), dueDate: formData.get("dueDate"),
  });
  await prisma.aiActionItem.create({
    data: {
      projectId, task: action.task, owner: action.owner,
      dueDate: new Date(`${action.dueDate}T00:00:00+08:00`),
    },
  });
  refreshDashboard();
}

async function toggleAction(actionId: string, isCompleted: boolean) {
  "use server";
  await prisma.aiActionItem.update({ where: { id: actionId }, data: { isCompleted } });
  refreshDashboard();
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

function shortDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai", month: "numeric", day: "numeric",
  }).format(date);
}

function reportDate() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date()).replaceAll("/", ".");
}

export default async function AiProjectsDashboard() {
  const projects = await prisma.aiProject.findMany({
    orderBy: { order: "asc" },
    include: {
      progress: { orderBy: { createdAt: "desc" } },
      actions: { orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }] },
    },
  });
  const actions = projects.flatMap((project) => project.actions);
  const today = dateKey(new Date());
  const dueToday = actions.filter((item) => !item.isCompleted && dateKey(item.dueDate) === today).length;
  const openActions = actions.filter((item) => !item.isCompleted).length;
  const nearestDue = actions
    .filter((item) => !item.isCompleted && dateKey(item.dueDate) > today)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]?.dueDate;
  const nearestDueCount = nearestDue
    ? actions.filter((item) => !item.isCompleted && dateKey(item.dueDate) === dateKey(nearestDue)).length : 0;

  return (
    <div className="pb-10 text-[#111411]">
      <header className="relative overflow-hidden border border-[#dfe3dc] bg-white p-6 sm:p-8 mb-6 shadow-[0_8px_30px_rgba(16,24,12,0.06)]">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] text-[#416700]">
              <CircleDot className="h-3.5 w-3.5" /> AI INITIATIVE CONTROL CENTER
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#080a08]">AI 应用项目看板</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#50564d]">公开维护公司内部 AI 产品的交付状态、当前进展、协同负责人和近期行动项。</p>
          </div>
          <div className="flex items-start gap-3">
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 bg-primary px-4 py-3 text-sm font-bold text-black hover:bg-primary-hover">
                <Plus className="h-4 w-4" /> 新增产品
              </summary>
              <form action={createProject} className="absolute right-0 z-30 mt-2 w-[min(88vw,420px)] space-y-4 border border-[#dfe3dc] bg-white p-5 shadow-2xl">
                <div><label className={labelClass} htmlFor="new-project-name">产品名称</label><input className={fieldClass} id="new-project-name" name="name" required maxLength={100} /></div>
                <div><label className={labelClass} htmlFor="new-project-subtitle">产品简介</label><input className={fieldClass} id="new-project-subtitle" name="subtitle" maxLength={200} /></div>
                <div>
                  <label className={labelClass} htmlFor="new-project-status">当前状态</label>
                  <select className={fieldClass} id="new-project-status" name="status" defaultValue="planning">
                    <option value="planning">规划中</option><option value="evaluating">试用评估</option><option value="delivered">已交付</option><option value="launched">已上线</option>
                  </select>
                </div>
                <div><label className={labelClass} htmlFor="new-project-progress">首条进展</label><textarea className={fieldClass} id="new-project-progress" name="progress" rows={3} maxLength={500} /></div>
                <button className="w-full bg-primary px-4 py-2.5 text-sm font-bold text-black hover:bg-primary-hover" type="submit">创建产品</button>
              </form>
            </details>
            <div className="hidden sm:block border border-[#dfe3dc] bg-[#f6f8f4] px-4 py-3 text-right">
              <div className="text-[10px] font-mono tracking-[0.18em] text-[#737a70]">REPORT DATE</div>
              <div className="mt-1 font-mono text-sm font-bold text-[#111411]">{reportDate()}</div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6" aria-label="项目总览">
        {[
          { label: "产品总数", value: projects.length, suffix: "个", icon: BrainCircuit, tone: "text-[#416700]" },
          { label: "待办行动项", value: openActions, suffix: "项", icon: CheckCircle2, tone: "text-[#13743a]" },
          { label: "今日到期", value: dueToday, suffix: "项", icon: Clock3, tone: "text-accent" },
          { label: nearestDue ? `${shortDate(nearestDue)} 到期` : "近期到期", value: nearestDueCount, suffix: "项", icon: CalendarClock, tone: "text-[#9a6000]" },
        ].map((metric) => (
          <div key={metric.label} className="border border-[#dfe3dc] bg-white p-4 sm:p-5 shadow-[0_4px_18px_rgba(16,24,12,0.04)]">
            <div className="mb-4 flex items-center justify-between"><span className="text-xs text-[#50564d]">{metric.label}</span><metric.icon className={`h-4 w-4 ${metric.tone}`} /></div>
            <div className="text-3xl font-black tracking-tight text-[#111411]">{metric.value}<span className="ml-1 text-sm font-medium text-[#737a70]">{metric.suffix}</span></div>
          </div>
        ))}
      </section>

      <div className="space-y-5">
        {projects.map((project, index) => {
          const owners = [...new Set(project.actions.map((item) => item.owner))];
          const ProjectIcon = [Search, Smartphone, ShoppingCart, BrainCircuit][index % 4];
          const status = statusMeta[project.status as keyof typeof statusMeta] ?? statusMeta.planning;
          return (
            <article key={project.id} className="border border-[#dfe3dc] bg-white overflow-hidden shadow-[0_5px_22px_rgba(16,24,12,0.045)]">
              <div className="grid lg:grid-cols-[280px_1fr]">
                <div className="relative border-b lg:border-b-0 lg:border-r border-[#dfe3dc] p-6 bg-[#f7f9f5]">
                  <span className="absolute right-5 top-3 font-mono text-5xl font-black text-black/[0.055]">{String(index + 1).padStart(2, "0")}</span>
                  <div className="mb-6 flex h-10 w-10 items-center justify-center border border-primary/40 bg-primary/10 text-[#416700]"><ProjectIcon className="h-5 w-5" /></div>
                  <div className={`inline-flex border px-2.5 py-1 text-[11px] font-bold ${status.className}`}>{status.label}</div>
                  <h2 className="mt-4 text-xl font-bold tracking-tight text-[#111411]">{project.name}</h2>
                  <p className="mt-2 text-xs leading-5 text-[#50564d]">{project.subtitle || "暂无产品简介"}</p>
                  <div className="mt-6 border-t border-[#dfe3dc] pt-4">
                    <div className="mb-3 flex items-center gap-2 text-[11px] text-[#737a70]"><Users className="h-3.5 w-3.5" /> 协同负责人</div>
                    <div className="flex flex-wrap gap-2">
                      {owners.length > 0 ? owners.map((owner) => <span key={owner} className="border border-[#d4d9d1] bg-white px-2.5 py-1 text-xs text-[#111411]">{owner}</span>) : <span className="text-xs text-[#737a70]">待补充</span>}
                    </div>
                  </div>
                  <details className="group mt-5 border-t border-[#dfe3dc] pt-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-[#50564d] hover:text-[#416700]">
                      <span className="flex items-center gap-2"><Pencil className="h-3.5 w-3.5" /> 编辑产品信息</span><ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                    </summary>
                    <form action={updateProject.bind(null, project.id)} className="mt-4 space-y-3">
                      <input className={fieldClass} name="name" defaultValue={project.name} required maxLength={100} aria-label="产品名称" />
                      <input className={fieldClass} name="subtitle" defaultValue={project.subtitle} maxLength={200} aria-label="产品简介" />
                      <select className={fieldClass} name="status" defaultValue={project.status} aria-label="项目状态">
                        <option value="planning">规划中</option><option value="evaluating">试用评估</option><option value="delivered">已交付</option><option value="launched">已上线</option>
                      </select>
                      <button className="w-full border border-primary px-3 py-2 text-xs font-bold text-[#416700] hover:bg-primary hover:text-black" type="submit">保存修改</button>
                    </form>
                  </details>
                </div>

                <div className="p-5 sm:p-6">
                  <section className="mb-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.18em] text-[#416700]"><Database className="h-3.5 w-3.5" /> CURRENT PROGRESS</div>
                      <details className="group relative">
                        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-[#416700]"><Plus className="h-3.5 w-3.5" /> 更新进展</summary>
                        <form action={addProgress.bind(null, project.id)} className="absolute right-0 z-20 mt-2 w-[min(78vw,380px)] space-y-3 border border-[#dfe3dc] bg-white p-4 shadow-2xl">
                          <textarea className={fieldClass} name="content" required rows={4} maxLength={500} placeholder="记录最新进展、里程碑或风险…" aria-label="最新进展" />
                          <button className="w-full bg-primary px-3 py-2 text-xs font-bold text-black" type="submit">发布进展</button>
                        </form>
                      </details>
                    </div>
                    <div className="space-y-3">
                      {project.progress.length > 0 ? project.progress.map((item, progressIndex) => (
                        <div key={item.id} className="flex items-start gap-3 text-sm text-[#111411]">
                          <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${progressIndex === 0 ? "text-[#416700]" : "text-[#737a70]"}`} />
                          <div><p>{item.content}</p><time className="mt-1 block font-mono text-[10px] text-[#737a70]" dateTime={item.createdAt.toISOString()}>{shortDate(item.createdAt)} 更新</time></div>
                        </div>
                      )) : <p className="text-sm text-[#737a70]">暂无进展记录</p>}
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.18em] text-[#737a70]"><ArrowRight className="h-3.5 w-3.5" /> NEXT ACTIONS</div>
                      <details className="group relative">
                        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-[#416700]"><Plus className="h-3.5 w-3.5" /> 新增行动项</summary>
                        <form action={addAction.bind(null, project.id)} className="absolute right-0 z-20 mt-2 w-[min(82vw,420px)] space-y-3 border border-[#dfe3dc] bg-white p-4 shadow-2xl">
                          <textarea className={fieldClass} name="task" required rows={3} maxLength={500} placeholder="行动项内容" aria-label="行动项内容" />
                          <div className="grid grid-cols-2 gap-3"><input className={fieldClass} name="owner" required maxLength={50} placeholder="负责人" aria-label="负责人" /><input className={fieldClass} name="dueDate" required type="date" aria-label="截止日期" /></div>
                          <button className="w-full bg-primary px-3 py-2 text-xs font-bold text-black" type="submit">添加行动项</button>
                        </form>
                      </details>
                    </div>
                    <div className="divide-y divide-[#dfe3dc] border-y border-[#dfe3dc]">
                      {project.actions.length > 0 ? project.actions.map((item) => {
                        const itemDate = dateKey(item.dueDate);
                        const isDueToday = !item.isCompleted && itemDate === today;
                        return (
                          <div key={item.id} className="grid gap-3 py-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center">
                            <form action={toggleAction.bind(null, item.id, !item.isCompleted)}>
                              <button type="submit" aria-label={item.isCompleted ? "恢复行动项" : "标记行动项完成"} className={`flex h-7 w-7 items-center justify-center border transition-colors ${item.isCompleted ? "border-primary bg-primary text-black" : "border-[#bfc5bc] text-transparent hover:border-primary"}`}><Check className="h-4 w-4" /></button>
                            </form>
                            <p className={`text-sm leading-6 ${item.isCompleted ? "text-[#737a70] line-through" : "text-[#111411]"}`}>{item.task}</p>
                            <div className="flex items-center gap-2 text-xs text-[#50564d]"><span className="flex h-6 w-6 items-center justify-center bg-primary/10 font-bold text-[#416700]">{item.owner.slice(0, 1)}</span><span>{item.owner}</span></div>
                            <time dateTime={itemDate} className={`w-fit border px-2.5 py-1 font-mono text-xs ${item.isCompleted ? "border-[#9ac45a] bg-[#f1f8e8] text-[#416700]" : isDueToday ? "border-[#e8a2a2] bg-[#fff0f0] text-[#b42323]" : "border-[#d4d9d1] bg-[#f6f8f4] text-[#50564d]"}`}>
                              {item.isCompleted ? "已完成" : isDueToday ? `今日 ${shortDate(item.dueDate)}` : shortDate(item.dueDate)}
                            </time>
                          </div>
                        );
                      }) : <p className="py-4 text-sm text-[#737a70]">暂无行动项</p>}
                    </div>
                  </section>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="border border-dashed border-[#cfd4cc] py-16 text-center"><BrainCircuit className="mx-auto h-8 w-8 text-[#416700]" /><h2 className="mt-4 text-lg font-bold text-[#111411]">还没有 AI 产品</h2><p className="mt-2 text-sm text-[#50564d]">点击右上角“新增产品”开始建立公开项目看板。</p></div>
      )}
      <div className="mt-6 flex items-center justify-between gap-4 border border-primary/25 bg-primary/5 p-4 text-sm">
        <div><span className="font-bold text-[#111411]">协作提示：</span><span className="text-[#50564d]"> 看板为公开协作模式，更新会立即对所有访问者可见。</span></div><ExternalLink className="h-4 w-4 shrink-0 text-[#416700]" />
      </div>
    </div>
  );
}
