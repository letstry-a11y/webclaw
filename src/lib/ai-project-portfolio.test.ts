import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { filterPortfolio, readPortfolio } from "./ai-project-portfolio";
import { requestStatuses } from "./ai-project-workflow";

test("project list defaults to lifecycle order and respects the selected sort within filters", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "medbot-stage-sort-"));
  const file = path.join(dir, "test.db");
  const url = "file:" + file;
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    writeFileSync(file, "");
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"], {
      env: { ...process.env, DATABASE_URL: url }, stdio: "pipe",
    });
    const early = new Date("2025-01-01T00:00:00Z");
    const late = new Date("2025-01-02T00:00:00Z");
    const common = { title: "测试", requesterName: "测试", requesterDepartment: "测试组", requesterEmail: "test@example.invalid",
      background: "", currentProblem: "", desiredFunctions: "", businessValue: "", expectedDeliverables: "",
      createdAt: early, updatedAt: early };
    await db.aiDemandRequest.createMany({ data: [
      ...[...requestStatuses].reverse().map((status) => ({ ...common, id: status, status })),
      { ...common, id: "b", status: "recruiting", updatedAt: late, targetDate: late, basePointPool: 100 },
      { ...common, id: "a", status: "recruiting", updatedAt: late, basePointPool: 900, finalPointPool: 30 },
    ] });
    await db.aiDemandRequest.update({ where: { id: "recruiting" }, data: { targetDate: early, updatedAt: early } });
    const productCodes = ["warranty", "launched", "delivered", "evaluating", "developing", "planning"];
    await db.aiProject.createMany({ data: productCodes.map((status) => ({
      id: status, name: "历史产品", status, createdAt: early, updatedAt: early,
    })) });
    const rows = await db.$transaction((tx) => readPortfolio(tx, late));
    const expected = [
      "product:planning", "request:pending_review",
      "request:a", "request:b", "request:recruiting",
      "request:team_confirmed", "product:developing", "request:developing",
      "product:evaluating", "request:trial", "product:delivered", "request:delivered_pending_review",
      "request:scored_pending_allocation", "request:warranty", "product:launched", "request:completed",
      "product:warranty", // This code is valid only on workflow requests.
    ];
    for (const sort of [undefined, "", "stage", "unknown"]) {
      assert.deepEqual(filterPortfolio(rows, { sort }).map((row) => row.id), expected);
    }
    const sortedRecruitment = (sort: string) =>
      filterPortfolio(rows, { phase: "recruiting", sort }).map((row) => row.id);
    assert.deepEqual(sortedRecruitment("points"), ["request:b", "request:a", "request:recruiting"]);
    assert.deepEqual(sortedRecruitment("due"), ["request:recruiting", "request:b", "request:a"]);
    assert.deepEqual(sortedRecruitment("updated"), ["request:a", "request:b", "request:recruiting"]);
    const priority = filterPortfolio(rows, { sort: "priority" });
    assert.ok(priority[0].flags.includes("decision"));
    assert.ok(priority.findIndex((row) => row.id === "request:recruiting") < priority.findIndex((row) => row.id === "request:a"));
  } finally {
    await db.$disconnect();
    rmSync(dir, { recursive: true, force: true });
  }
});
