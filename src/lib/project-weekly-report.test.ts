import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { reportingWeek, shanghaiDate } from "./report-week";

test("Shanghai weeks start at Monday midnight and reject invalid calendar dates", () => {
  const before = new Date("2025-01-05T15:59:59.999Z");
  const monday = new Date("2025-01-05T16:00:00.000Z");
  assert.equal(reportingWeek(undefined, before)?.start, "2024-12-30");
  const week = reportingWeek(undefined, monday)!;
  assert.equal(week.start, "2025-01-06");
  assert.equal(week.from, monday.toISOString());
  assert.equal(week.until, "2025-01-12T16:00:00.000Z");
  assert.equal(shanghaiDate(before), "2025-01-05");
  for (const date of ["2025-02-30", "2025-1-6", "invalid", ""]) assert.equal(reportingWeek(date), null);
});

test("portfolio and weekly exports use one canonical row per project and only events in the selected week", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "medbot-report-test-"));
  const db = path.join(dir, "sample.db");
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "file:" + db;
  writeFileSync(db, "");
  const { prisma } = await import("./prisma");
  try {
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"], { env: process.env, stdio: "pipe" });
    const { filterPortfolio, loadPortfolio } = await import("./ai-project-portfolio");
    const { loadWeeklyReport, reportCsv, reportMarkdown } = await import("./project-weekly-report");
    const now = new Date("2025-01-15T02:00:00Z");
    const registered = new Date("2025-01-07T01:00:00Z");
    const data = { title: "测试项目", requesterName: "需求人", requesterDepartment: "测试组", requesterEmail: "fixture@example.invalid",
      background: "测试", currentProblem: "测试", desiredFunctions: "测试", businessValue: "测试", expectedDeliverables: "测试",
      createdAt: registered, updatedAt: registered };
    const req = await prisma.aiDemandRequest.create({ data: { ...data, targetDate: registered } });
    const independent = await prisma.aiProject.create({ data: { name: data.title, createdAt: registered, status: "legacy-unmapped", updatedAt: registered } });
    const intake = await loadPortfolio(now);
    assert.equal(intake.length, 2);
    const requestKey = "request:" + req.id;
    assert.equal(intake.find((row) => row.id === requestKey)?.basePoints, null);
    assert.equal(filterPortfolio(intake, { flag:"overdue" }).length, 1);
    assert.equal(filterPortfolio(intake, { phase:"other" })[0].id, "product:" + independent.id);
    const product = await prisma.aiProject.create({ data: { name: "=样例|项目", owner: "旧负责人", requestId:req.id, createdAt: registered, updatedAt: registered } });
    await prisma.aiDemandRequest.update({ where:{ id:req.id }, data: { status:"warranty", basePointPool:1000, finalPointPool:1200, projectLevel:2 } });
    const lead = await prisma.aiProjectTeamMember.create({ data: { requestId:req.id, name:"负责人甲", email:"owner@example.invalid", department:"测试组", role:"负责人", isLead:true } });
    await prisma.aiProjectPointAllocation.create({ data:{requestId:req.id, teamMemberId:lead.id, proposedPoints:1200, issuedPoints:840, warrantyPoints:360} });
    await prisma.aiWorkflowLog.createMany({ data: [
      { requestId:req.id, action:"周内变更", actor:"测试", createdAt:new Date("2025-01-12T15:59:59.999Z") },
      { requestId:req.id, action:"下周变更", actor:"测试", createdAt:new Date("2025-01-12T16:00:00.000Z") },
    ] });
    await prisma.aiProjectProgress.create({ data: { projectId:product.id, content:"联调通过", createdAt:registered } });
    await prisma.aiWeeklyUpdate.create({ data: { requestId:req.id, weekStart:"2025-01-06", author:"填报人", achievement:'示例,"一"\n第二行', nextStep:"试用", blocker:"待样本" } });
    const report = await loadWeeklyReport(reportingWeek("2025-01-10")!, now);
    assert.equal(report.summary.total, 2);
    assert.deepEqual(report.weekTotals, { newProjects:2, changedProjects:2, reportedProjects:1, blockedProjects:1 });
    const row = report.projects.find((item) => item.id === requestKey)!;
    assert.equal(row.productId, product.id);
    assert.equal(row.stage.phase, "warranty");
    assert.equal(row.owner, "负责人甲");
    assert.deepEqual([row.basePoints,row.finalPoints,row.issuedPoints], [1000,1200,840]);
    assert.equal(row.flags.includes("overdue"), false);
    assert.deepEqual(row.week.events.map((e)=>e.text), ["联调通过", "周内变更"]);
    assert.equal(row.latestProgress, "下周变更");
    assert.equal(filterPortfolio(report.projects, { owner:row.owner!, q:"测试组" })[0].id, requestKey);
    const next = await loadWeeklyReport(reportingWeek("2025-01-13")!, now);
    assert.deepEqual(next.weekTotals, { newProjects:0, changedProjects:1, reportedProjects:0, blockedProjects:0 });
    const csv = reportCsv(report);
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes(`"'=样例|项目"`) && csv.includes('示例,""一""\n第二行'));
    assert.ok(reportMarkdown(report).includes("=样例\\|项目"));
    assert.ok(!JSON.stringify(report).includes("@example.invalid"));
    const { settleWarrantyPoints } = await import("./ai-project-settlement");
    await prisma.aiPointMember.create({ data:{ name:lead.name, email:lead.email, historicalPoints:840, availablePoints:840 } });
    await Promise.all([settleWarrantyPoints(req.id, "测试"), settleWarrantyPoints(req.id, "测试")]);
    const member = await prisma.aiPointMember.findUniqueOrThrow({ where:{ email:lead.email } });
    assert.deepEqual([member.historicalPoints,member.availablePoints],[1200,1200]);
    assert.equal(await prisma.aiPointEntry.count({ where:{ memberId:member.id } }),1);
    assert.equal((await loadPortfolio(now)).find((item)=>item.id===requestKey)?.issuedPoints,1200);
  } finally {
    await prisma.$disconnect();
    if (previous === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous;
    rmSync(dir, { recursive:true, force:true });
  }
});
