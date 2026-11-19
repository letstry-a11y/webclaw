import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { projectLeadSelection, projectOwnerNames } from "./ai-project-leads";
import { requestStatuses, requestStatusMeta, type AiRequestStatus } from "./ai-project-workflow";
import { shanghaiDate } from "./report-week";

export const phaseNames = {
  intake: "需求评审", recruiting: "招募中", execution: "执行中", closing: "结题与分配",
  warranty: "质保中", completed: "已完成", other: "状态待核对",
} as const;
export type Phase = keyof typeof phaseNames;
export const flagNames = { decision: "待处理", overdue: "交付逾期", stale: "21 天无公开更新", unassigned: "待定负责人" } as const;
type Flag = keyof typeof flagNames;

const stages: Record<AiRequestStatus, { phase: Phase; next: string }> = {
  pending_review: { phase: "intake", next: "委员会评审等级与积分" },
  recruiting: { phase: "recruiting", next: "需求方筛选并确认团队" },
  team_confirmed: { phase: "execution", next: "负责人启动开发" },
  developing: { phase: "execution", next: "提交试用评估" },
  trial: { phase: "execution", next: "需求方确认交付" },
  delivered_pending_review: { phase: "closing", next: "委员会评定成效系数" },
  scored_pending_allocation: { phase: "closing", next: "负责人分配积分" },
  warranty: { phase: "warranty", next: "质保结束后发放尾款积分" },
  completed: { phase: "completed", next: "流程已结束" },
};
export const productStages = {
  planning: { label: "规划中", workflowStatus: "pending_review" },
  developing: { label: "开发中", workflowStatus: "developing" },
  evaluating: { label: "试用评估", workflowStatus: "trial" },
  delivered: { label: "已交付", workflowStatus: "delivered_pending_review" },
  launched: { label: "已上线", workflowStatus: "completed" },
} as const satisfies Record<string, { label: string; workflowStatus: AiRequestStatus }>;

const stagePositions = new Map<string, number>(requestStatuses.map((code, index) => [code, index]));
for (const [code, { workflowStatus }] of Object.entries(productStages)) {
  stagePositions.set(code, requestStatuses.indexOf(workflowStatus));
}

const latestFirst = [{ createdAt: "desc" }, { id: "desc" }] as const;
const projectSelect = {
  id: true, name: true, subtitle: true, owner: true, status: true, businessImpact: true,
  releasePlan: true, createdAt: true, updatedAt: true,
  progress: { orderBy: [...latestFirst], take: 1, select: { content: true, createdAt: true } },
  actions: { where: { isCompleted: false }, orderBy: [{ dueDate: "asc" }, { id: "asc" }], take: 1,
    select: { task: true, dueDate: true, owner: true } },
} satisfies Prisma.AiProjectSelect;
const requestSelect = {
  id: true, title: true, businessValue: true, status: true, requesterName: true, requesterDepartment: true,
  committeeAssistant: true, projectLevel: true, basePointPool: true, finalPointPool: true, targetDate: true,
  createdAt: true, updatedAt: true, project: { select: projectSelect },
  teamMembers: projectLeadSelection,
  _count: { select: { applications: true, teamMembers: true } },
  allocations: { select: { issuedPoints: true } },
  logs: { orderBy: [...latestFirst], take: 1, select: { action: true, detail: true, createdAt: true } },
} satisfies Prisma.AiDemandRequestSelect;

type Demand = Prisma.AiDemandRequestGetPayload<{ select: typeof requestSelect }>;
type Product = Prisma.AiProjectGetPayload<{ select: typeof projectSelect }>;

export const progressLogAction = "项目进展更新";

function describeStage(request: Demand | null, product: Product | null) {
  if (request) {
    const stage = requestStatuses.find((key) => key === request.status);
    if (stage) {
      const index = requestStatuses.indexOf(stage);
      return { ...stages[stage], label: requestStatusMeta[stage].label, code: stage,
        // Share of workflow milestones reached, not an estimate of implementation effort.
        workflowPercent: Math.round((index + 1) * 100 / requestStatuses.length) };
    }
  } else if (product && Object.hasOwn(productStages, product.status)) {
    const stage = productStages[product.status as keyof typeof productStages];
    return { phase: stages[stage.workflowStatus].phase, label: stage.label, code: product.status,
      next: product.releasePlan || "维护产品资料", workflowPercent: null };
  }
  return { phase: "other" as const, code: request?.status ?? product?.status ?? "", label: "状态待核对", next: "核对项目记录", workflowPercent: null };
}

function portfolioRow(request: Demand | null, product: Product | null, now: Date) {
  const record = request ?? product!;
  const stage = describeStage(request, product);
  const log = request?.logs[0];
  const progress = product?.progress[0];
  const activity = [
    { text: request ? "需求已提交" : "产品已登记", at: record.createdAt },
    ...(log ? [{ text: log.action === progressLogAction ? log.detail || log.action : log.action, at: log.createdAt }] : []),
    ...(progress ? [{ text: progress.content, at: progress.createdAt }] : []),
  ].reduce((latest, item) => item.at >= latest.at ? item : latest);
  const registeredAt = product && product.createdAt < record.createdAt ? product.createdAt : record.createdAt;
  const updatedAt = new Date(Math.max(activity.at.getTime(), record.updatedAt.getTime(), product?.updatedAt.getTime() ?? 0));
  const owners = projectOwnerNames(request?.teamMembers, product?.owner);
  const owner = owners.join("、") || null;
  const targetDate = request?.targetDate ? shanghaiDate(request.targetDate) : null;
  const flags: Flag[] = [];
  if (request && ["intake", "closing"].includes(stage.phase)) flags.push("decision");
  if (targetDate && targetDate < shanghaiDate(now) && ["intake", "recruiting", "execution"].includes(stage.phase)) flags.push("overdue");
  if (stage.phase !== "completed" && now.getTime() - updatedAt.getTime() >= 21 * 86_400_000) flags.push("stale");
  if (!owner && stage.phase !== "completed") flags.push("unassigned");
  const task = product?.actions[0];
  return {
    id: request ? `request:${request.id}` : `product:${product!.id}`,
    title: product?.name.trim() || request?.title || "未命名产品", requestTitle: request?.title ?? null,
    href: request ? `/ai-requests/${request.id}` : `/ai-projects/products/${product!.id}`,
    productId: product?.id ?? null, businessImpact: product?.businessImpact.trim() || request?.businessValue || "",
    stage, flags, owner, owners, level: request?.projectLevel ?? null,
    basePoints: request?.basePointPool ?? null, finalPoints: request?.finalPointPool ?? null,
    issuedPoints: request?.allocations.reduce((sum, item) => sum + item.issuedPoints, 0) ?? null,
    requester: request?.requesterName || null, department: request?.requesterDepartment || null,
    assistant: request?.committeeAssistant || null, applicants: request?._count.applications ?? null,
    teamSize: request?._count.teamMembers ?? null, targetDate, releasePlan: product?.releasePlan || null,
    createdAt: registeredAt.toISOString(), updatedAt: updatedAt.toISOString(),
    latestProgress: activity.text, latestProgressAt: activity.at.toISOString(),
    nextAction: task ? { task: task.task, owner: task.owner, dueDate: shanghaiDate(task.dueDate) } : null,
  };
}

export type PortfolioRow = ReturnType<typeof portfolioRow>;

export function portfolioStagePosition(stage: PortfolioRow["stage"]) {
  return stage.phase === "other" ? requestStatuses.length : stagePositions.get(stage.code) ?? requestStatuses.length;
}

export async function readPortfolio(tx: Prisma.TransactionClient, now: Date) {
  const requests = await tx.aiDemandRequest.findMany({ select: requestSelect });
  const standalone = await tx.aiProject.findMany({ where: { requestId: null }, select: projectSelect });
  return [...requests.map((request) => portfolioRow(request, request.project, now)),
    ...standalone.map((product) => portfolioRow(null, product, now))];
}

export function loadPortfolio(now = new Date()) {
  return prisma.$transaction((tx) => readPortfolio(tx, now));
}

export function summarize(rows: PortfolioRow[]) {
  const countFlag = (flag: Flag) => rows.filter((row) => row.flags.includes(flag)).length;
  const sum = (field: "basePoints" | "finalPoints" | "issuedPoints") => rows.reduce((n, row) => n + (row[field] ?? 0), 0);
  return {
    total: rows.length, completed: rows.filter((r) => r.stage.phase === "completed").length,
    decisions: countFlag("decision"), overdue: countFlag("overdue"), stale: countFlag("stale"),
    basePoints: sum("basePoints"), finalPoints: sum("finalPoints"), issuedPoints: sum("issuedPoints"),
  };
}

export type PortfolioFilters = { q?: string; phase?: string; stage?: string; owner?: string; flag?: string; sort?: string };
export function filterPortfolio(rows: PortfolioRow[], filters: PortfolioFilters = {}) {
  const needle = filters.q?.trim().toLocaleLowerCase();
  const filtered = rows.filter((row) => {
    const text = [row.title, row.requestTitle, row.owner, row.requester, row.department, row.assistant].join(" ").toLocaleLowerCase();
    return (!needle || text.includes(needle)) && (!filters.phase || filters.phase === row.stage.phase) &&
      (!filters.stage || filters.stage === row.stage.code) &&
      (!filters.owner || (filters.owner === "_unassigned" ? !row.owners.length : row.owners.includes(filters.owner))) &&
      (!filters.flag || row.flags.includes(filters.flag as Flag));
  });
  return filtered.sort((a, b) => {
    let rank = 0;
    if (filters.sort === "points") rank = (b.finalPoints ?? b.basePoints ?? -1) - (a.finalPoints ?? a.basePoints ?? -1);
    else if (filters.sort === "due") rank = (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999");
    else if (filters.sort === "priority") {
      const priority = (r: PortfolioRow) => r.flags.includes("decision") ? 0 : r.flags.includes("overdue") ? 1 : r.stage.phase === "completed" ? 3 : 2;
      rank = priority(a) - priority(b);
    } else if (filters.sort !== "updated") {
      rank = portfolioStagePosition(a.stage) - portfolioStagePosition(b.stage);
    }
    return rank || b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id);
  });
}
