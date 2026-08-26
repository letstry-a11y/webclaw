/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs/promises");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

process.env.TZ ||= "Asia/Shanghai";

function previousFridayAtFive(now = new Date()) {
  const end = new Date(now);
  end.setHours(17, 0, 0, 0);
  const daysSinceFriday = (end.getDay() - 5 + 7) % 7;
  end.setDate(end.getDate() - daysSinceFriday);
  if (end > now) end.setDate(end.getDate() - 7);
  return end;
}

function formatSeconds(seconds) {
  const safe = Math.max(0, Math.round(seconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rest = safe % 60;
  if (hours) return `${hours}小时 ${minutes}分 ${rest}秒`;
  if (minutes) return `${minutes}分 ${rest}秒`;
  return `${rest}秒`;
}

function classifyDevice(userAgent) {
  if (/bot|crawler|spider|slurp/i.test(userAgent)) return "自动程序";
  if (/tablet|ipad/i.test(userAgent)) return "平板";
  if (/mobile|iphone|android/i.test(userAgent)) return "移动端";
  return "桌面端";
}

function classifyBrowser(userAgent) {
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/Chrome\//.test(userAgent)) return "Chrome";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return "Safari";
  return "其他";
}

function dayKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dateTime(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function rankMap(map, limit = 15) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function escapeTable(value) {
  return String(value || "-").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function analyze(records, periodStart, periodEnd) {
  const uniqueIps = new Set();
  const sessions = new Set();
  const paths = new Map();
  const ips = new Map();
  const daily = new Map();
  const devices = new Map();
  const browsers = new Map();
  const referrers = new Map();
  let totalDuration = 0;
  let shortVisits = 0;

  for (const record of records) {
    uniqueIps.add(record.ipAddress);
    sessions.add(record.sessionId);
    totalDuration += record.durationSeconds;
    if (record.durationSeconds < 10) shortVisits += 1;
    increment(ips, record.ipAddress);
    increment(daily, dayKey(record.startedAt));
    increment(devices, classifyDevice(record.userAgent));
    increment(browsers, classifyBrowser(record.userAgent));

    let referrer = "直接访问";
    if (record.referrer) {
      try {
        referrer = new URL(record.referrer).hostname || "直接访问";
      } catch {
        referrer = "其他来源";
      }
    }
    increment(referrers, referrer);

    const current = paths.get(record.path) || {
      path: record.path,
      title: record.pageTitle,
      views: 0,
      duration: 0,
      sessions: new Set(),
      ips: new Set(),
    };
    current.views += 1;
    current.duration += record.durationSeconds;
    current.sessions.add(record.sessionId);
    current.ips.add(record.ipAddress);
    if (record.pageTitle) current.title = record.pageTitle;
    paths.set(record.path, current);
  }

  const pathRows = [...paths.values()]
    .map((item) => ({
      path: item.path,
      title: item.title,
      views: item.views,
      sessions: item.sessions.size,
      uniqueVisitors: item.ips.size,
      totalDuration: item.duration,
      averageDuration: item.views ? Math.round(item.duration / item.views) : 0,
    }))
    .sort((a, b) => b.views - a.views);

  const engaged = [...pathRows].filter((item) => item.views >= 2).sort((a, b) => b.averageDuration - a.averageDuration)[0];
  const topPath = pathRows[0];
  const topReferrer = rankMap(referrers, 1)[0];
  const insights = [];
  if (topPath) insights.push(`访问量最高的内容是“${topPath.title || topPath.path}”，共 ${topPath.views} 次浏览。`);
  if (engaged) insights.push(`平均停留时间最高的内容是“${engaged.title || engaged.path}”，平均 ${formatSeconds(engaged.averageDuration)}。`);
  if (records.length) insights.push(`少于 10 秒的访问占 ${Math.round(shortVisits / records.length * 100)}%，可用于识别误入或内容匹配度问题。`);
  if (topReferrer) insights.push(`主要访问来源为“${topReferrer[0]}”，带来 ${topReferrer[1]} 次浏览。`);
  if (!records.length) insights.push("本周期没有采集到访问记录。请确认站点已部署最新版本且访问采集接口正常。 ");

  return {
    generatedAt: new Date(),
    periodStart,
    periodEnd,
    overview: {
      pageViews: records.length,
      uniqueVisitors: uniqueIps.size,
      sessions: sessions.size,
      totalDuration,
      averageDuration: records.length ? Math.round(totalDuration / records.length) : 0,
      shortVisitRate: records.length ? Math.round(shortVisits / records.length * 100) : 0,
    },
    pathRows,
    topIps: rankMap(ips, 20).map(([ipAddress, pageViews]) => ({ ipAddress, pageViews })),
    daily: rankMap(daily, 31).sort((a, b) => a[0].localeCompare(b[0])).map(([date, pageViews]) => ({ date, pageViews })),
    devices: rankMap(devices).map(([name, pageViews]) => ({ name, pageViews })),
    browsers: rankMap(browsers).map(([name, pageViews]) => ({ name, pageViews })),
    referrers: rankMap(referrers).map(([name, pageViews]) => ({ name, pageViews })),
    insights,
  };
}

function buildMarkdown(report) {
  const lines = [
    `# Medbot 每周访问分析｜${dayKey(report.periodEnd)}`,
    "",
    `> 统计周期：${dateTime(report.periodStart)} 至 ${dateTime(report.periodEnd)}（Asia/Shanghai）`,
    `> 生成时间：${dateTime(report.generatedAt)}`,
    "> 本报告仅保存在后台访问记录目录，包含 IP 等内部访问数据，请勿公开传播。",
    "",
    "## 核心指标",
    "",
    "| 指标 | 数值 |",
    "| --- | ---: |",
    `| 页面浏览量 | ${report.overview.pageViews} |`,
    `| 独立访问 IP | ${report.overview.uniqueVisitors} |`,
    `| 访问会话 | ${report.overview.sessions} |`,
    `| 总停留时长 | ${formatSeconds(report.overview.totalDuration)} |`,
    `| 平均单页停留 | ${formatSeconds(report.overview.averageDuration)} |`,
    `| 短访问（<10秒）占比 | ${report.overview.shortVisitRate}% |`,
    "",
    "## 分析摘要",
    "",
    ...report.insights.map((item) => `- ${item}`),
    "",
    "## 热门访问内容",
    "",
    "| 页面 | 标题 | 浏览量 | 独立 IP | 平均停留 |",
    "| --- | --- | ---: | ---: | ---: |",
    ...report.pathRows.slice(0, 20).map((item) => `| ${escapeTable(item.path)} | ${escapeTable(item.title)} | ${item.views} | ${item.uniqueVisitors} | ${formatSeconds(item.averageDuration)} |`),
    "",
    "## 每日趋势",
    "",
    "| 日期 | 浏览量 |",
    "| --- | ---: |",
    ...report.daily.map((item) => `| ${item.date} | ${item.pageViews} |`),
    "",
    "## 活跃访问 IP",
    "",
    "| IP | 浏览量 |",
    "| --- | ---: |",
    ...report.topIps.map((item) => `| ${escapeTable(item.ipAddress)} | ${item.pageViews} |`),
    "",
    "## 设备与浏览器",
    "",
    "| 类型 | 分类 | 浏览量 |",
    "| --- | --- | ---: |",
    ...report.devices.map((item) => `| 设备 | ${item.name} | ${item.pageViews} |`),
    ...report.browsers.map((item) => `| 浏览器 | ${item.name} | ${item.pageViews} |`),
    "",
    "## 来源网站",
    "",
    "| 来源 | 浏览量 |",
    "| --- | ---: |",
    ...report.referrers.map((item) => `| ${escapeTable(item.name)} | ${item.pageViews} |`),
    "",
  ];
  return lines.join("\n");
}

async function generateReport(options = {}) {
  const prisma = options.prisma || new PrismaClient();
  const shouldDisconnect = !options.prisma;
  const periodEnd = options.periodEnd || previousFridayAtFive();
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const outputRoot = options.outputRoot || process.env.ANALYTICS_REPORT_DIR || path.join(process.cwd(), "访问记录");

  try {
    const records = await prisma.visitRecord.findMany({
      where: { startedAt: { gte: periodStart, lt: periodEnd } },
      orderBy: { startedAt: "asc" },
    });
    const report = analyze(records, periodStart, periodEnd);
    const endDay = dayKey(periodEnd);
    const year = endDay.slice(0, 4);
    const outputDir = path.join(outputRoot, year);
    await fs.mkdir(outputDir, { recursive: true });
    const markdownPath = path.join(outputDir, `访问分析-${endDay}.md`);
    const jsonPath = path.join(outputDir, `访问分析-${endDay}.json`);
    await fs.writeFile(markdownPath, buildMarkdown(report), "utf8");
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
    return { markdownPath, jsonPath, pageViews: report.overview.pageViews };
  } finally {
    if (shouldDisconnect) await prisma.$disconnect();
  }
}

if (require.main === module) {
  generateReport()
    .then((result) => console.log(`[analytics] 周报已生成：${result.markdownPath}（${result.pageViews} 次浏览）`))
    .catch((error) => {
      console.error("[analytics] 周报生成失败", error);
      process.exitCode = 1;
    });
}

module.exports = { analyze, buildMarkdown, formatSeconds, generateReport, previousFridayAtFive };
