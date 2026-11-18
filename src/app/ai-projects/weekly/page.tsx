import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { loadWeeklyReport } from "@/lib/project-weekly-report";
import { reportingWeek, shanghaiDate } from "@/lib/report-week";
import WeeklyNoteForm from "./WeeklyNoteForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "项目管理周报 · Medbot", robots: { index: false } };

export default async function WeeklyPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const input = (await searchParams).week;
  const current = reportingWeek()!;
  const selected = reportingWeek(typeof input === "string" ? input : undefined);
  const week = selected && selected.start <= current.start ? selected : current;
  const link = (day: string) => "/ai-projects/weekly?week=" + day;
  if (!await isAdmin()) redirect("/admin/login?next=weekly&week=" + week.start);
  const report = await loadWeeklyReport(week);
  const { newProjects, changedProjects, reportedProjects, blockedProjects } = report.weekTotals;
  const present = report.projects.filter((row) => row.createdAt < week.until || row.week.events.length || row.week.note);
  return <div className="portfolio-shell"><div className="portfolio-wrap">
    <Link className="portfolio-text-link" href="/ai-projects">← 项目总览</Link>
    <header className="portfolio-header mt-3"><div><h1>项目管理周报</h1><p>{week.start} 至 {week.through} · 上海时间，周一至周日</p></div>
      <div className="portfolio-links">{[["csv","下载项目清单"],["md","下载周报"],["json","查看 JSON"]].map(([format,label]) =>
        <a key={format} className="portfolio-button" href={`/api/management/ai-projects?week=${week.start}&format=${format}`}>{label}</a>)}</div>
    </header>
    <section className="portfolio-stats" aria-label="所选周概况">
      {[[newProjects,"新增项目"],[changedProjects,"有记录的项目"],[reportedProjects,"已填周进展"],[blockedProjects,"已填报阻碍"]].map(([n,label]) =>
        <div key={label}><span>{label}</span><strong>{n}</strong></div>)}
    </section>
    <section className="portfolio-panel">
      <form className="portfolio-filters" method="get" action="/ai-projects/weekly"><label>选择周内日期<input type="date" name="week" defaultValue={week.start} max={shanghaiDate(new Date())} required/></label>
        <button className="portfolio-button" type="submit">查看该周</button><Link className="portfolio-text-link" href={link(week.previous)}>上一周</Link>
        {week.start < current.start && <><Link className="portfolio-text-link" href={link(week.next)}>下一周</Link><Link className="portfolio-text-link" href={link(current.start)}>本周</Link></>}
      </form>
      <div className="portfolio-title"><h2>项目周进展</h2><span>{present.length} 个项目</span></div>
      <p className="px-5 pb-4 text-sm text-slate-600">流程变动按发生日期归集，可在对应周补填成果、计划和资源需求。导出的全量清单反映采集时的节点与积分。</p>
      {present.map((row) => <article key={row.id} id={"row-" + row.id} className="border-t border-slate-200 px-5 py-4">
        <h3 className="text-lg font-bold"><Link href={row.href} className="text-[#153e77] hover:underline">{row.title}</Link></h3>
        <p className="mt-1 text-sm text-slate-600">{row.owner || "负责人待确认"} · 当前{row.stage.label}</p>
        {row.week.events.length > 0 ? <ul className="mt-2 list-disc pl-5 text-sm">{row.week.events.map((e,i) =>
          <li key={i}>{shanghaiDate(e.at)}　{e.text}</li>)}</ul> : <p className="mt-2 text-sm">{row.week.createdInWeek ? "本周登记项目" : "本周暂无流程或进展记录"}</p>}
        {row.week.note && <dl className="week-note">{[["本周成果",row.week.note.achievement],["下周计划",row.week.note.nextStep],["阻碍与资源",row.week.note.blocker],["填报人",row.week.note.author]].filter(([,v])=>v).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
        <details className="mt-3 max-w-3xl"><summary className="cursor-pointer text-sm font-bold text-[#194c94]">{row.week.note ? "修改周进展" : "填写周进展"}</summary>
          <WeeklyNoteForm projectKey={row.id} week={week.start} note={row.week.note}/></details>
      </article>)}
      {!present.length && <p className="portfolio-empty">该周尚无已登记的项目。</p>}
    </section>
  </div></div>;
}
