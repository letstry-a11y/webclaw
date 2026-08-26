export const requestStatuses = [
  "pending_review",
  "recruiting",
  "team_confirmed",
  "developing",
  "trial",
  "delivered_pending_review",
  "scored_pending_allocation",
  "warranty",
  "completed",
] as const;

export const committeeAssistants = ["朱祥", "邵辉", "李涛", "戴婷萍"] as const;

export type AiRequestStatus = (typeof requestStatuses)[number];

export const requestStatusMeta: Record<AiRequestStatus, { label: string; description: string; tone: string }> = {
  pending_review: { label: "待AI发展委员会评审", description: "需求已提交，等待确定项目等级与积分总包", tone: "border-[#e9bd71] bg-[#fff7e8] text-[#8a5700]" },
  recruiting: { label: "社区招募中", description: "项目已通过评审，正在公开征集团队成员", tone: "border-[#8aa6ff] bg-[#eef2ff] text-[#032a72]" },
  team_confirmed: { label: "团队已确认", description: "团队组建完成，项目已进入 AI 看板", tone: "border-[#9fb2f7] bg-[#eef2ff] text-[#032a72]" },
  developing: { label: "开发中", description: "项目团队正在实现和验证核心功能", tone: "border-[#7aa5dc] bg-[#edf5ff] text-[#14569b]" },
  trial: { label: "试用评估", description: "产品进入需求方试用与效果验证阶段", tone: "border-[#e9bd71] bg-[#fff7e8] text-[#8a5700]" },
  delivered_pending_review: { label: "待结题评审", description: "成果已交付，等待 AI发展委员会确认成效系数", tone: "border-[#ad9fe8] bg-[#f4f0ff] text-[#58409a]" },
  scored_pending_allocation: { label: "待积分分配", description: "AI发展委员会已确认成效系数，等待负责人提出个人积分方案", tone: "border-[#ad9fe8] bg-[#f4f0ff] text-[#58409a]" },
  warranty: { label: "质保中", description: "首期 70% 积分已发放，剩余积分待质保期结束", tone: "border-[#7dc89a] bg-[#edf9f1] text-[#13743a]" },
  completed: { label: "已结题", description: "项目和质保均已完成，积分已全部发放", tone: "border-[#7dc89a] bg-[#edf9f1] text-[#13743a]" },
};

export const applicationStatusMeta = {
  pending: { label: "待评估", tone: "bg-[#f3f6fb] text-[#52627d]" },
  reserve: { label: "候补", tone: "bg-[#fff7e8] text-[#8a5700]" },
  selected: { label: "已入选", tone: "bg-[#edf9f1] text-[#13743a]" },
  rejected: { label: "未入选", tone: "bg-[#f7eeee] text-[#9b3030]" },
} as const;

export const effectCoefficientOptions = [
  { value: 1.5, label: "1.5｜远超预期（政策分档 X≥90）" },
  { value: 1.2, label: "1.2｜超额完成（政策分档 85≤X＜90）" },
  { value: 1, label: "1.0｜顺利完成（政策分档 80≤X＜85）" },
  { value: 0.8, label: "0.8｜基本完成（政策分档 70≤X＜80）" },
  { value: 0.5, label: "0.5｜未完成目标（政策分档 X＜70）" },
  { value: 0.4, label: "0.4｜未完成目标（政策分档 X＜70）" },
  { value: 0.3, label: "0.3｜未完成目标（政策分档 X＜70）" },
  { value: 0.2, label: "0.2｜未完成目标（政策分档 X＜70）" },
  { value: 0.1, label: "0.1｜未完成目标（政策分档 X＜70）" },
] as const;

export const effectCoefficientValues = effectCoefficientOptions.map((option) => option.value);

export function formatProjectDate(value: Date | null | undefined) {
  if (!value) return "待确认";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}
