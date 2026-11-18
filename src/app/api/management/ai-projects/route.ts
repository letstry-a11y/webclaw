import { createHash, timingSafeEqual } from "node:crypto";
import { isAdmin } from "@/lib/auth";
import { loadWeeklyReport, reportCsv, reportMarkdown } from "@/lib/project-weekly-report";
import { reportingWeek } from "@/lib/report-week";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Authorization, Cookie", "X-Robots-Tag": "noindex" };

function hasReportToken(request: Request) {
  const expected = process.env.MANAGEMENT_REPORT_TOKEN;
  const value = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  if (!expected || !value) return false;
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(value), digest(expected));
}

export async function GET(request: Request) {
  if (!hasReportToken(request) && !await isAdmin()) {
    return Response.json({ error: "请登录管理后台，或使用周报只读令牌" }, { status: 401, headers });
  }
  const params = new URL(request.url).searchParams;
  const format = params.get("format") ?? "json";
  const now = new Date();
  const week = reportingWeek(params.get("week") ?? undefined, now);
  if (!week || week.start > reportingWeek(undefined, now)!.start || !["json", "csv", "md", "markdown"].includes(format)) {
    return Response.json({ error: "请使用有效的周内日期 YYYY-MM-DD，以及 json、csv 或 md 格式。" }, { status: 400, headers });
  }
  const report = await loadWeeklyReport(week, now);
  if (format === "json") return Response.json(report, { headers });
  const csv = format === "csv";
  return new Response(csv ? reportCsv(report) : reportMarkdown(report), { headers: {
    ...headers, "Content-Type": csv ? "text/csv; charset=utf-8" : "text/markdown; charset=utf-8",
    "Content-Disposition": `attachment; filename="medbot-projects-${week.start}.${csv ? "csv" : "md"}"`,
  } });
}
