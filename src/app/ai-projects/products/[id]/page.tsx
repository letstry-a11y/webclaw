import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { projectLeadSelection, projectOwnerNames } from "@/lib/ai-project-leads";
import { productStages, progressLogAction } from "@/lib/ai-project-portfolio";
import { formatProjectDate } from "@/lib/ai-project-workflow";
import ActionForm from "@/components/ai/ActionForm";
import ProgressForm from "@/components/ai/ProgressForm";
import { saveProduct } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "产品资料 · Medbot" };

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.aiProject.findUnique({ where: { id }, include: {
    request: { select: { id: true, committeeAssistant: true, teamMembers: projectLeadSelection,
      logs: { where: { action: progressLogAction }, orderBy: { createdAt: "desc" }, select: { detail: true, createdAt: true } } } },
    actions: { orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }] }, progress: { orderBy: { createdAt: "desc" } },
  } });
  if (!product) notFound();
  const req = product.request;
  const owner = projectOwnerNames(req?.teamMembers, product.owner).join("、");
  const history = [...product.progress, ...(req?.logs ?? []).map((l) => ({ content:l.detail, createdAt:l.createdAt }))].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
  const state = Object.hasOwn(productStages, product.status) ? productStages[product.status as keyof typeof productStages].label : "状态待核对";
  return <div className="portfolio-shell"><div className="portfolio-wrap max-w-5xl!">
    <Link className="portfolio-text-link" href="/ai-projects">← 项目总览</Link>
    <header className="portfolio-header mt-3 mb-6"><div><h1>{product.name}</h1><p>{state} · 负责人 {owner || "待确认"} · 发布时间 {product.releasePlan || "待确认"}</p></div>
      {req && <Link href={"/ai-requests/" + req.id} className="portfolio-button">查看项目流程</Link>}
    </header>
    <section className="portfolio-panel p-5"><h2 className="text-xl font-bold">产品资料</h2>
      <dl className="week-note">{[["功能介绍",product.subtitle],["业务影响",product.businessImpact],["委员会协助人",req?.committeeAssistant]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v || "待补充"}</dd></div>)}</dl>
      <details className="mt-4"><summary className="cursor-pointer font-bold text-[#194c94]">编辑产品资料</summary>
        <ActionForm action={saveProduct.bind(null,id)} button="保存产品资料" className="weekly-form mt-4">
          <input type="hidden" name="version" value={product.updatedAt.toISOString()}/>
          <label>产品名称<input name="name" defaultValue={product.name} required maxLength={120}/></label>
          <label>功能介绍<textarea name="subtitle" defaultValue={product.subtitle} maxLength={3000} rows={3}/></label>
          <label>业务影响<textarea name="businessImpact" defaultValue={product.businessImpact} maxLength={3000} rows={3}/></label>
          <label>发布时间<input name="releasePlan" defaultValue={product.releasePlan} maxLength={120}/></label>
          {req ? <p className="text-sm text-slate-600">负责人和阶段随项目流程更新。</p> : <>
            <label>负责人<input name="owner" defaultValue={product.owner} maxLength={120}/></label>
            <label>产品状态<select name="status" defaultValue={product.status}>{Object.entries(productStages).map(([code,s])=><option value={code} key={code}>{s.label}</option>)}</select></label>
          </>}
        </ActionForm>
      </details>
    </section>
    <section className="portfolio-panel mt-4 p-5"><h2 className="text-xl font-bold">项目进展</h2>
      <ProgressForm type="product" id={id}/>{history.length ? <ul className="mt-4 space-y-2">{history.map((p,i)=><li key={i}>{formatProjectDate(p.createdAt)}　{p.content}</li>)}</ul> : <p className="mt-3 text-sm">暂无进展记录。</p>}
    </section>
    {product.actions.length > 0 && <section className="portfolio-panel mt-4 p-5"><h2 className="text-xl font-bold">行动项</h2><ul className="mt-3 space-y-2">{product.actions.map((a)=><li key={a.id}>{a.isCompleted ? "已完成" : "待处理"} · {a.task} · {a.owner} · {formatProjectDate(a.dueDate)}</li>)}</ul></section>}
  </div></div>;
}
