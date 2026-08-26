export const requestStatuses = [
  "pending_review",
  "recruiting",
  "team_confirmed",
  "developing",
  "trial",
  "delivered_pending_review",
  "scored_pending_allocation",
  "allocation_pending_approval",
  "warranty",
  "completed",
] as const;

export type AiRequestStatus = (typeof requestStatuses)[number];

export const requestStatusMeta: Record<AiRequestStatus, { label: string; description: string; tone: string }> = {
  pending_review: { label: "待委员会评审", description: "需求已提交，等待确定项目等级与积分总包", tone: "border-[#e9bd71] bg-[#fff7e8] text-[#8a5700]" },
  recruiting: { label: "社区招募中", description: "项目已通过评审，正在公开征集团队成员", tone: "border-[#8aa6ff] bg-[#eef2ff] text-[#032a72]" },
  team_confirmed: { label: "团队已确认", description: "团队组建完成，项目已进入 AI 看板", tone: "border-[#9fb2f7] bg-[#eef2ff] text-[#032a72]" },
  developing: { label: "开发中", description: "项目团队正在实现和验证核心功能", tone: "border-[#7aa5dc] bg-[#edf5ff] text-[#14569b]" },
  trial: { label: "试用评估", description: "产品进入需求方试用与效果验证阶段", tone: "border-[#e9bd71] bg-[#fff7e8] text-[#8a5700]" },
  delivered_pending_review: { label: "待结题评分", description: "成果已交付，等待 AI 委员会评分", tone: "border-[#ad9fe8] bg-[#f4f0ff] text-[#58409a]" },
  scored_pending_allocation: { label: "待积分分配", description: "委员会评分完成，等待负责人提出个人积分方案", tone: "border-[#ad9fe8] bg-[#f4f0ff] text-[#58409a]" },
  allocation_pending_approval: { label: "待积分审核", description: "个人积分方案已提交，等待委员会确认", tone: "border-[#e9bd71] bg-[#fff7e8] text-[#8a5700]" },
  warranty: { label: "质保中", description: "首期 70% 积分已发放，剩余积分待质保期结束", tone: "border-[#7dc89a] bg-[#edf9f1] text-[#13743a]" },
  completed: { label: "已结题", description: "项目和质保均已完成，积分已全部发放", tone: "border-[#7dc89a] bg-[#edf9f1] text-[#13743a]" },
};

export const applicationStatusMeta = {
  pending: { label: "待评估", tone: "bg-[#f3f6fb] text-[#52627d]" },
  reserve: { label: "候补", tone: "bg-[#fff7e8] text-[#8a5700]" },
  selected: { label: "已入选", tone: "bg-[#edf9f1] text-[#13743a]" },
  rejected: { label: "未入选", tone: "bg-[#f7eeee] text-[#9b3030]" },
} as const;

export function coefficientForScore(score: number, lowScoreCoefficient?: number) {
  if (score >= 95) return 1.5;
  if (score >= 90) return 1.3;
  if (score >= 85) return 1.1;
  if (score >= 80) return 1;
  if (score >= 70) return 0.8;
  return Math.min(0.5, Math.max(0.1, lowScoreCoefficient ?? 0.3));
}

export function formatProjectDate(value: Date | null | undefined) {
  if (!value) return "待确认";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}
