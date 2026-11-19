import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, ClipboardList, Plus, Search } from "lucide-react";
import { filterPortfolio, flagNames, loadPortfolio, phaseNames, portfolioStagePosition, summarize, type PortfolioFilters } from "@/lib/ai-project-portfolio";
import { shanghaiDate } from "@/lib/report-week";
import PortfolioSortSelect from "./PortfolioSortSelect";

export const metadata: Metadata = { title: "AI 项目总览 · Medbot", description: "项目清单、流程进展、负责人及积分台账" };
export const dynamic = "force-dynamic";
const formatNumber = (value: number | null) => value === null ? "—" : value.toLocaleString("zh-CN");

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const all = await loadPortfolio();
  const filters: PortfolioFilters = {};
  for (const key of ["q", "phase", "stage", "flag", "owner", "sort"] as const) {
    if (typeof params[key] === "string") filters[key] = params[key];
  }
  const items = filterPortfolio(all, filters);
  const totals = summarize(all);
  const owners = [...new Set(all.flatMap((row) => row.owner ? [row.owner] : []))].sort((a,b) => a.localeCompare(b, "zh-CN"));
  const stages = [...new Map(all.map((row) => [row.stage.code, row.stage])).values()]
    .sort((a, b) => portfolioStagePosition(a) - portfolioStagePosition(b) || a.label.localeCompare(b.label, "zh-CN"));
  const hasAdvancedFilters = Boolean(filters.owner || filters.stage || filters.flag || (filters.sort && filters.sort !== "stage"));
  function listHref(changes: PortfolioFilters) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, ...changes })) if (value) query.set(key, value);
    return "/ai-projects" + (query.size ? "?" + query : "") + "#project-list";
  }
  return (
    <div className="portfolio-shell">
      <div className="portfolio-wrap">
        <header className="portfolio-header">
          <div><h1>AI 项目总览</h1><p>从需求评审到质保结题，跟踪每个项目的负责人、进展和积分。</p></div>
          <div className="portfolio-links">
            <Link className="portfolio-button" href="/ai-projects/weekly"><CalendarDays size={16}/>管理周报</Link>
            <Link className="portfolio-button primary" href="/ai-requests/new"><Plus size={16}/>提交需求</Link>
          </div>
        </header>
        <section className="portfolio-stats" aria-label="全量项目概况">
          <div><span>在册项目</span><strong>{totals.total}</strong><small>含已完成 {totals.completed} 项</small></div>
          <div><span>待处理节点</span><strong>{totals.decisions}</strong><Link href="/ai-projects?flag=decision#project-list">查看评审与分配 <ArrowRight size={13}/></Link></div>
          <div><span>交付已逾期</span><strong>{totals.overdue}</strong><Link href="/ai-projects?flag=overdue#project-list">查看目标已过项目 <ArrowRight size={13}/></Link></div>
          <div><span>已发项目积分</span><strong>{formatNumber(totals.issuedPoints)}</strong><small>已核定 {formatNumber(totals.finalPoints)} 分</small></div>
        </section>
        <section id="project-list" className="portfolio-panel">
          <div className="portfolio-title"><h2><ClipboardList size={21}/>项目清单</h2><span>显示 {items.length} / {all.length} 项</span></div>
          <nav className="phase-tabs" aria-label="项目阶段">
            {[["", "全部"], ...Object.entries(phaseNames).filter(([phase]) => phase !== "other" || all.some((r) => r.stage.phase === "other"))].map(([key, label]) => (
              <Link key={key} aria-current={(filters.phase || "") === key ? "page" : undefined} href={listHref({ phase: key, stage: "" })}>
                {label} <span>{key ? all.filter((r) => r.stage.phase === key).length : all.length}</span>
              </Link>
            ))}
          </nav>
          <Form className="portfolio-filters" action="/ai-projects#project-list" key={JSON.stringify(filters)}>
            {filters.phase && <input type="hidden" name="phase" value={filters.phase}/>}
            <label className="portfolio-search">搜索项目或人员<input name="q" type="search" defaultValue={filters.q} maxLength={150} placeholder="项目名、姓名或部门"/></label>
            <input className="filter-toggle" id="more-filters" type="checkbox" defaultChecked={hasAdvancedFilters}/>
            <label className="filter-toggle-label" htmlFor="more-filters">更多筛选</label>
            <div className="filter-options">
            <label>流程节点<select name="stage" defaultValue={filters.stage}><option value="">全部节点</option>{stages.map(({code,label}) => <option key={code} value={code}>{label}</option>)}</select></label>
            <label>负责人<select name="owner" defaultValue={filters.owner}><option value="">全部负责人</option><option value="_unassigned">待确认</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select></label>
            <label>提醒<select name="flag" defaultValue={filters.flag}><option value="">全部提醒</option>{Object.entries(flagNames).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <PortfolioSortSelect sort={filters.sort}/>
            </div>
            <button className="portfolio-button" type="submit"><Search size={15}/>筛选</button>
            {(filters.q || filters.phase || hasAdvancedFilters) && <Link className="portfolio-text-link" href="/ai-projects#project-list">重置</Link>}
          </Form>
          {items.length ? <div className="portfolio-table-wrap"><table className="portfolio-table">
            <caption className="sr-only">项目进展及积分清单</caption>
            <thead><tr><th scope="col">项目 / 需求方</th><th scope="col">负责人 / 委员会协助人</th><th scope="col">积分（分）</th><th scope="col">流程进度 / 最近进展</th><th scope="col">时间与提醒</th></tr></thead>
            <tbody>{items.map((row) => <tr key={row.id}>
              <th scope="row"><Link href={row.href}>{row.title}</Link><small>{[row.department, row.requester].filter(Boolean).join(" · ") || "历史独立项目"}</small>
                {row.productId && <Link className="product-profile" href={`/ai-projects/products/${row.productId}`}>产品资料 <ArrowRight size={12}/></Link>}
              </th>
              <td data-label="项目人员"><b>{row.owner ?? "待确认"}</b><small>协助 · {row.assistant ?? "待指定"}</small></td>
              <td data-label="积分"><b>{formatNumber(row.basePoints)}</b> <span className="cell-caption">基础</span><small>核定 {formatNumber(row.finalPoints)} · 已发 {formatNumber(row.issuedPoints)}</small></td>
              <td data-label="进展"><b>{row.stage.label}</b>{row.stage.workflowPercent !== null &&
                <progress aria-label="流程节点进度" value={row.stage.workflowPercent} max={100} title={`流程节点进度 ${row.stage.workflowPercent}%`}/>}
                <small className="progress-text">{row.latestProgress}</small>
              </td>
              <td data-label="日期"><span>目标 {row.targetDate ?? "待确认"}</span>{row.releasePlan && <small>发布 {row.releasePlan}</small>}<small>更新 {shanghaiDate(row.updatedAt)}</small>
                <div className="portfolio-flags">{row.flags.map((f) => <span key={f} data-flag={f}>{flagNames[f]}</span>)}</div>
              </td>
            </tr>)}</tbody>
          </table></div> : <div className="portfolio-empty"><BookOpen size={24}/><h3>{all.length ? "没有符合筛选条件的项目" : "暂无项目"}</h3>
            <Link href={all.length ? "/ai-projects#project-list" : "/ai-requests/new"}>{all.length ? "清除筛选" : "提交第一条需求"}</Link></div>}
        </section>
        <div className="portfolio-foot"><span>进度条表示项目当前所处的流程节点。</span><Link href="/ai-requests">需求与招募 <ArrowRight size={14}/></Link><Link href="/ai-points">个人积分榜 <ArrowRight size={14}/></Link></div>
      </div>
    </div>
  );
}
