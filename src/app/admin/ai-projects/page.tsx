import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import Link from "next/link";
import {
  BrainCircuit, CalendarClock, ChevronDown, CircleDot, ClipboardPlus, Pencil,
  Rocket, Search, ShoppingCart, Smartphone, Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

const projectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  subtitle: z.string().trim().max(300),
  businessImpact: z.string().trim().max(500),
  owner: z.string().trim().max(120),
  releasePlan: z.string().trim().max(120),
  status: z.enum(["planning", "developing", "evaluating", "delivered", "launched"]),
});

const statusMeta = {
  planning: { label: "规划中", className: "border-[#cbd5e6] bg-[#f3f6fb] text-[#52627d]" },
  developing: { label: "开发中", className: "border-[#7aa5dc] bg-[#edf5ff] text-[#14569b]" },
  evaluating: { label: "试用评估", className: "border-[#e9bd71] bg-[#fff7e8] text-[#8a5700]" },
  delivered: { label: "已交付", className: "border-[#9fb2f7] bg-[#eef2ff] text-[#032a72]" },
  launched: { label: "已上线", className: "border-[#7dc89a] bg-[#edf9f1] text-[#13743a]" },
} as const;

const fieldClass = "w-full border border-[#cbd5e6] bg-white px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#8491a8] focus:border-[#4870ff] focus:outline-none focus:ring-1 focus:ring-[#4870ff]";
const labelClass = "mb-1.5 block text-xs font-medium text-[#52627d]";

function projectFromForm(formData: FormData) {
  return projectSchema.parse({
    name: formData.get("name"),
    subtitle: formData.get("subtitle") ?? "",
    businessImpact: formData.get("businessImpact") ?? "",
    owner: formData.get("owner") ?? "",
    releasePlan: formData.get("releasePlan") ?? "",
    status: formData.get("status"),
  });
}

function refreshDashboard() {
  revalidatePath("/ai-projects");
  revalidatePath("/admin/ai-projects");
}

async function updateProject(projectId: string, formData: FormData) {
  "use server";
  await prisma.aiProject.update({ where: { id: projectId }, data: projectFromForm(formData) });
  refreshDashboard();
}

function ProjectFields({ project }: {
  project?: { name: string; subtitle: string; businessImpact: string; owner: string; releasePlan: string; status: string };
}) {
  return (
    <>
      <div><label className={labelClass}>产品名称</label><input className={fieldClass} name="name" defaultValue={project?.name} required maxLength={100} /></div>
      <div><label className={labelClass}>功能介绍</label><textarea className={fieldClass} name="subtitle" defaultValue={project?.subtitle} rows={3} maxLength={300} placeholder="产品解决什么问题、具备哪些核心能力" /></div>
      <div><label className={labelClass}>业务影响</label><textarea className={fieldClass} name="businessImpact" defaultValue={project?.businessImpact} rows={3} maxLength={500} placeholder="对效率、收入、成本或客户体验的影响" /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={labelClass}>负责人</label><input className={fieldClass} name="owner" defaultValue={project?.owner} maxLength={120} placeholder="姓名或项目组" /></div>
        <div><label className={labelClass}>发布时间</label><input className={fieldClass} name="releasePlan" defaultValue={project?.releasePlan} maxLength={120} placeholder="如：2026 年 8 月已上线" /></div>
      </div>
      <div>
        <label className={labelClass}>产品状态</label>
        <select className={fieldClass} name="status" defaultValue={project?.status ?? "planning"}>
          <option value="planning">规划中</option>
          <option value="developing">开发中</option>
          <option value="evaluating">试用评估</option>
          <option value="delivered">已交付</option>
          <option value="launched">已上线</option>
        </select>
      </div>
    </>
  );
}

export default async function AiProjectsDashboard() {
  const projects = await prisma.aiProject.findMany({ orderBy: { order: "asc" } });
  const releasedCount = projects.filter((project) => project.status === "delivered" || project.status === "launched").length;
  const exploringCount = projects.length - releasedCount;

  return (
    <div className="pb-8 text-[#111827]">
      <header className="relative mb-5 overflow-hidden border border-[#d8e0ee] bg-white p-5 shadow-[0_6px_24px_rgba(3,42,114,0.06)] sm:p-6">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-[#032a72]">
              <CircleDot className="h-3.5 w-3.5" /> AI PRODUCT PORTFOLIO
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#080a08] sm:text-4xl">AI 应用项目看板</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52627d]">集中展示公司 AI 产品的核心功能、业务价值与计划发布时间。</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex border border-[#d8e0ee] bg-[#f7f9fc] text-sm">
              <div className="border-r border-[#d8e0ee] px-4 py-2.5"><span className="text-[#6b7890]">产品</span><strong className="ml-2 text-lg text-[#032a72]">{projects.length}</strong></div>
              <div className="border-r border-[#d8e0ee] px-4 py-2.5"><span className="text-[#6b7890]">已发布</span><strong className="ml-2 text-lg text-[#13743a]">{releasedCount}</strong></div>
              <div className="px-4 py-2.5"><span className="text-[#6b7890]">探索中</span><strong className="ml-2 text-lg text-[#8a5700]">{exploringCount}</strong></div>
            </div>
            <Link href="/ai-requests" className="flex items-center gap-2 bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-hover"><ClipboardPlus className="h-4 w-4" />提交 AI 需求</Link>
          </div>
        </div>
      </header>

      {projects.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="AI 产品列表">
          {projects.map((project, index) => {
            const ProjectIcon = [Search, Smartphone, ShoppingCart, BrainCircuit][index % 4];
            const status = statusMeta[project.status as keyof typeof statusMeta] ?? statusMeta.planning;
            return (
              <article key={project.id} className="flex flex-col border border-[#d8e0ee] bg-white p-5 shadow-[0_4px_18px_rgba(3,42,114,0.045)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-primary/35 bg-primary/10 text-[#032a72]"><ProjectIcon className="h-4.5 w-4.5" /></div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex border px-2 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span>
                    <span className="font-mono text-xs font-bold text-[#a8b2c4]">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                </div>

                <h2 className="mt-4 text-xl font-bold tracking-tight text-[#111827]">{project.name}</h2>
                {project.requestId && <Link href={`/ai-requests/${project.requestId}`} className="mt-2 inline-flex items-center text-xs font-bold text-[#032a72] hover:underline">查看需求、团队与积分流程</Link>}

                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#032a72]"><BrainCircuit className="h-3.5 w-3.5" /> 功能介绍</dt>
                    <dd className="leading-6 text-[#4f5f78]">{project.subtitle || "待补充产品核心功能"}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#032a72]"><Rocket className="h-3.5 w-3.5" /> 业务影响</dt>
                    <dd className="leading-6 text-[#4f5f78]">{project.businessImpact || "待补充业务价值与影响"}</dd>
                  </div>
                </dl>

                <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[#e2e8f2] pt-4 text-xs">
                  <div><span className="mb-1 flex items-center gap-1 text-[#8491a8]"><Users className="h-3.5 w-3.5" /> 负责人</span><strong className="font-medium text-[#26344b]">{project.owner || "待确认"}</strong></div>
                  <div><span className="mb-1 flex items-center gap-1 text-[#8491a8]"><CalendarClock className="h-3.5 w-3.5" /> 发布时间</span><strong className="font-medium text-[#26344b]">{project.releasePlan || "待确认"}</strong></div>
                </div>

                <details className="group mt-4 border-t border-[#e2e8f2] pt-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-[#52627d] hover:text-[#032a72]">
                    <span className="flex items-center gap-1.5"><Pencil className="h-3.5 w-3.5" /> 编辑产品信息</span>
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                  </summary>
                  <form action={updateProject.bind(null, project.id)} className="mt-4 space-y-3 border-t border-[#e2e8f2] pt-4">
                    <ProjectFields project={project} />
                    <button className="w-full border border-primary px-3 py-2 text-xs font-bold text-[#032a72] hover:bg-primary hover:text-white" type="submit">保存修改</button>
                  </form>
                </details>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="border border-dashed border-[#cbd5e6] py-16 text-center">
          <BrainCircuit className="mx-auto h-8 w-8 text-[#032a72]" />
          <h2 className="mt-4 text-lg font-bold">还没有 AI 产品</h2>
          <p className="mt-2 text-sm text-[#52627d]">请先提交 AI 应用需求；评审、招募并确认团队后，项目会自动进入这里。</p>
        </div>
      )}
    </div>
  );
}
