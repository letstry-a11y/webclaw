/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");
const { analyze, nextFridayAtFive } = (() => {
  const report = require("./analytics-report.cjs");
  const scheduler = require("./weekly-analytics-scheduler.cjs");
  return { ...report, ...scheduler };
})();

test("scheduler selects Friday at 17:00 Asia/Shanghai", () => {
  const next = nextFridayAtFive(new Date("2026-08-26T10:00:00+08:00"));
  assert.equal(next.toISOString(), "2026-08-28T09:00:00.000Z");
});

test("weekly analysis aggregates visits by path and IP", () => {
  const start = new Date("2026-08-21T17:00:00+08:00");
  const end = new Date("2026-08-28T17:00:00+08:00");
  const report = analyze([
    { ipAddress: "10.0.0.1", sessionId: "a", path: "/", pageTitle: "首页", referrer: "", userAgent: "Chrome/1", durationSeconds: 30, startedAt: start },
    { ipAddress: "10.0.0.1", sessionId: "a", path: "/ai", pageTitle: "AI", referrer: "https://example.com/x", userAgent: "Chrome/1", durationSeconds: 60, startedAt: start },
    { ipAddress: "10.0.0.2", sessionId: "b", path: "/", pageTitle: "首页", referrer: "", userAgent: "Mobile Safari/1", durationSeconds: 5, startedAt: start },
  ], start, end);
  assert.equal(report.overview.pageViews, 3);
  assert.equal(report.overview.uniqueVisitors, 2);
  assert.equal(report.overview.sessions, 2);
  assert.equal(report.overview.totalDuration, 95);
  assert.equal(report.pathRows[0].path, "/");
  assert.equal(report.pathRows[0].views, 2);
});
