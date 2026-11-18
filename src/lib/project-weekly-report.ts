import { filterPortfolio, flagNames, progressLogAction, readPortfolio, summarize } from "./ai-project-portfolio";
import { prisma } from "./prisma";
import type { ReportWeek } from "./report-week";

export async function loadWeeklyReport(week: ReportWeek, now = new Date()) {
  const dates = { gte: new Date(week.from), lt: new Date(week.until), lte: now };
  return prisma.$transaction(async (tx) => {
    const rows = filterPortfolio(await readPortfolio(tx, now));
    const productKeys = new Map(rows.filter((row) => row.productId).map((row) => [row.productId!, row.id]));
    const logs = await tx.aiWorkflowLog.findMany({
      where: { createdAt: dates }, select: { id: true, requestId: true, action: true, detail: true, createdAt: true },
    });
    const progress = await tx.aiProjectProgress.findMany({
      where: { createdAt: dates }, select: { id: true, projectId: true, content: true, createdAt: true },
    });
    const updates = await tx.aiWeeklyUpdate.findMany({
      where: { weekStart: week.start },
      select: { requestId: true, projectId: true, achievement: true, nextStep: true, blocker: true, author: true, updatedAt: true },
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    });
    const notes = new Map(updates.map(({ requestId, projectId, updatedAt, ...note }) => [
      requestId ? "request:" + requestId : productKeys.get(projectId!),
      { ...note, updatedAt: updatedAt.toISOString() },
    ]));
    const allEvents = [
      ...logs.map((log) => ({ project: "request:" + log.requestId, id: log.id, at: log.createdAt.toISOString(),
        text: log.action === progressLogAction ? log.detail : log.action })),
      ...progress.map((entry) => ({ project: productKeys.get(entry.projectId), id: entry.id, at: entry.createdAt.toISOString(), text: entry.content })),
    ].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
    const byProject = new Map<string, Array<{ at: string; text: string }>>();
    for (const { project, at, text } of allEvents) {
      if (!project) continue;
      const events = byProject.get(project) ?? [];
      events.push({ at, text });
      byProject.set(project, events);
    }
    const projects = rows.map((row) => {
      const events = byProject.get(row.id) ?? [];
      const createdInWeek = row.createdAt >= week.from && row.createdAt < week.until && row.createdAt <= now.toISOString();
      return { ...row, week: { createdInWeek, events, note: notes.get(row.id) ?? null } };
    });
    return {
      schemaVersion: 1, timezone: "Asia/Shanghai", generatedAt: now.toISOString(),
      period: { start: week.start, through: week.through, from: week.from, untilExclusive: week.until },
      summary: summarize(rows),
      weekTotals: {
        newProjects: projects.filter((r) => r.week.createdInWeek).length,
        changedProjects: projects.filter((r) => r.week.createdInWeek || r.week.events.length || r.week.note).length,
        reportedProjects: projects.filter((r) => r.week.note).length,
        blockedProjects: projects.filter((r) => r.week.note?.blocker).length,
      },
      projects,
    };
  });
}

export type WeeklyReport = Awaited<ReturnType<typeof loadWeeklyReport>>;

function spreadsheetCell(value: string | number | null) {
  let text = String(value ?? "");
  if (/^\s*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

export function reportCsv(report: WeeklyReport) {
  const headers = ["周起始", "周截止", "台账采集时间", "稳定编号", "项目名称", "当前节点", "流程节点进度(%)", "项目等级", "基础积分", "核定积分", "已发积分", "负责人", "需求方", "需求部门", "委员会协助人", "目标日期", "发布计划", "最近进展", "最近更新", "提醒", "本周新增", "本周流程与进展", "本周成果", "下周计划", "阻碍与资源", "填报人", "填报时间", "下一步行动"];
  const lines = report.projects.map((r) => [
    report.period.start, report.period.through, report.generatedAt, r.id, r.title, r.stage.label, r.stage.workflowPercent, r.level,
    r.basePoints, r.finalPoints, r.issuedPoints, r.owner, r.requester, r.department, r.assistant, r.targetDate, r.releasePlan,
    r.latestProgress, r.updatedAt, r.flags.map((f) => flagNames[f]).join("、"), r.week.createdInWeek ? "是" : "否", r.week.events.map((e) => e.at + " " + e.text).join("\n"),
    r.week.note?.achievement ?? "", r.week.note?.nextStep ?? "", r.week.note?.blocker ?? "", r.week.note?.author ?? "", r.week.note?.updatedAt ?? "", r.nextAction?.task ?? r.stage.next,
  ]);
  return "\uFEFF" + [headers, ...lines].map((line) => line.map(spreadsheetCell).join(",")).join("\r\n") + "\r\n";
}

function markdownCell(value: string | number | null) {
  return String(value ?? "—").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replace(/([\\|`*[\]_~])/g, "\\$1").replace(/[\r\n]+/g, " / ");
}

export function reportMarkdown(report: WeeklyReport) {
  const tableRow = (cells: Array<string | number | null>) => "| " + cells.map(markdownCell).join(" | ") + " |";
  const { period, weekTotals, summary } = report;
  return [
    "# AI 项目管理周报", "", `报告周期 ${period.start} 至 ${period.through}（上海时间）`, "",
    `本周新增 ${weekTotals.newProjects} 项，更新 ${weekTotals.changedProjects} 项，填报 ${weekTotals.reportedProjects} 项，填报阻碍 ${weekTotals.blockedProjects} 项。`,
    "", "## 本周记录", "", "| 项目 | 流程与进展 | 成果 | 下周计划 | 阻碍与资源 |", "|---|---|---|---|---|",
    ...report.projects.filter((r) => r.week.createdInWeek || r.week.events.length || r.week.note).map((r) => tableRow([
      r.title, r.week.events.map((e) => e.text).join("；") || (r.week.createdInWeek ? "项目登记" : "—"),
      r.week.note?.achievement ?? null, r.week.note?.nextStep ?? null, r.week.note?.blocker || null,
    ])),
    ...(weekTotals.changedProjects ? [] : ["", "本周暂无记录。"]),
    "", "## 当前项目清单", "", `台账采集于 ${report.generatedAt}。共 ${summary.total} 项，基础积分 ${summary.basePoints}，已核定 ${summary.finalPoints}，已发 ${summary.issuedPoints}。`,
    "", "| 项目 | 负责人 | 节点 | 最近进展 | 基础积分 | 核定积分 | 已发积分 | 目标日期 |", "|---|---|---|---|---:|---:|---:|---|",
    ...report.projects.map((r) => tableRow([r.title, r.owner, r.stage.label, r.latestProgress, r.basePoints, r.finalPoints, r.issuedPoints, r.targetDate])), "",
  ].join("\n");
}
