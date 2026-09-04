"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { committeeAssistants, effectCoefficientValues } from "@/lib/ai-project-workflow";
import { calculatePointAllocations } from "@/lib/ai-point-allocation";
import { aiProjectApplicationSchema } from "@/lib/ai-project-application";
import { attachmentSchema } from "@/lib/validators";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(120).transform((value) => value.toLowerCase());
const optionalDate = z.string().trim().transform((value) => value ? new Date(`${value}T00:00:00+08:00`) : null);

const requestSchema = z.object({
  title: z.string().trim().min(3, "需求名称至少填写 3 个字符").max(120),
  requesterName: z.string().trim().min(1, "请填写需求方姓名").max(50),
  requesterDepartment: z.string().trim().min(1, "请填写需求部门").max(80),
  requesterEmail: emailSchema,
  background: z.string().trim().min(10, "业务背景至少填写 10 个字符").max(3000),
  currentProblem: z.string().trim().min(10, "当前问题至少填写 10 个字符").max(3000),
  desiredFunctions: z.string().trim().min(10, "希望实现的功能至少填写 10 个字符").max(3000),
  businessValue: z.string().trim().min(10, "预期业务价值至少填写 10 个字符").max(3000),
  expectedDeliverables: z.string().trim().min(3, "预期交付成果至少填写 3 个字符").max(2000),
  targetDate: optionalDate,
  availableResources: z.string().trim().max(2000),
  attachments: z.string().max(20000).transform((value, context) => {
    try {
      return z.array(attachmentSchema).max(5).parse(JSON.parse(value || "[]"));
    } catch {
      context.addIssue({ code: "custom", message: "附件信息无效" });
      return z.NEVER;
    }
  }),
  dataSensitivity: z.enum(["public", "internal", "sensitive"]),
  recruitmentRoles: z.string().trim().min(3, "建议招募岗位至少填写 3 个字符").max(2000),
  weeklyCommitment: z.string().trim().max(500),
});

export type CreateAiRequestState = {
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  submissionKey: number;
};

const reviewSchema = z.object({
  projectLevel: z.coerce.number().int().min(1).max(5),
  basePointPool: z.coerce.number().int().min(1).max(1000000),
  recruitmentDeadline: optionalDate.refine((value) => value !== null, "必须填写报名截止日期"),
  plannedTeamSize: z.coerce.number().int().min(1).max(100),
  warrantyMonths: z.coerce.number().int().min(1).max(24),
  reviewedBy: z.string().trim().min(1).max(80),
  committeeAssistant: z.enum(committeeAssistants, { message: "请选择AI发展委员会协助人" }),
  reviewComment: z.string().trim().min(1, "请填写评审意见").max(2000),
});

const committeeAssistantSchema = z.enum(committeeAssistants, { message: "请选择AI发展委员会协助人" });

function refreshWorkflow(requestId?: string) {
  revalidatePath("/");
  revalidatePath("/activities");
  revalidatePath("/ai-requests");
  revalidatePath("/ai-projects");
  revalidatePath("/ai-points");
  if (requestId) revalidatePath(`/ai-requests/${requestId}`);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br />");
}

function recruitmentContent(request: {
  title: string;
  requesterName: string;
  requesterDepartment: string;
  requesterEmail: string;
  background: string;
  currentProblem: string;
  desiredFunctions: string;
  businessValue: string;
  expectedDeliverables: string;
  recruitmentRoles: string;
  weeklyCommitment: string;
}, review: Pick<z.infer<typeof reviewSchema>, "projectLevel" | "basePointPool" | "committeeAssistant">) {
  return `
<div style="border-left:5px solid #4870ff;background:#eef3fb;padding:18px 20px;margin-bottom:28px">
  <p style="margin:0 0 8px"><strong>AI 项目公开招募</strong></p>
  <p style="margin:0">该需求已经 AI发展委员会评审，项目等级为 ${review.projectLevel} 级，基础积分总包为 ${review.basePointPool.toLocaleString("zh-CN")} 分。团队确认后将自动进入 AI 项目看板。</p>
</div>
<p><strong>AI发展委员会协助人：</strong>${escapeHtml(review.committeeAssistant)}（协助项目团队协调资源）</p>
<h2>需求背景</h2><p>${escapeHtml(request.background)}</p>
<h2>当前问题</h2><p>${escapeHtml(request.currentProblem)}</p>
<h2>希望实现的功能</h2><p>${escapeHtml(request.desiredFunctions)}</p>
<h2>预期业务价值</h2><p>${escapeHtml(request.businessValue)}</p>
<h2>预期交付成果</h2><p>${escapeHtml(request.expectedDeliverables)}</p>
<h2>招募岗位与能力要求</h2><p>${escapeHtml(request.recruitmentRoles)}</p>
<h2>时间投入</h2><p>${escapeHtml(request.weeklyCommitment || "以项目团队确认结果为准")}</p>
<h2>需求方与联系方式</h2>
<p><strong>需求部门：</strong>${escapeHtml(request.requesterDepartment)}<br /><strong>需求方：</strong>${escapeHtml(request.requesterName)}<br /><strong>企业邮箱：</strong><a href="mailto:${escapeHtml(request.requesterEmail)}">${escapeHtml(request.requesterEmail)}</a></p>
<blockquote><strong>积分说明：</strong>最终项目总积分 = 基础积分总包 × 结题成效系数。个人积分根据实际贡献提出分配方案，并经 AI发展委员会确认后发放。</blockquote>
`;
}

export async function createAiRequest(
  previousState: CreateAiRequestState,
  formData: FormData,
): Promise<CreateAiRequestState> {
  const values = Object.fromEntries(
    [...formData.entries()].filter(
      ([key, value]) => key !== "attachments" && typeof value === "string",
    ),
  ) as Record<string, string>;
  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      message: "部分内容未达到提交要求，请按提示补充后重试。",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
      submissionKey: previousState.submissionKey + 1,
    };
  }

  const data = parsed.data;
  const { attachments, ...requestData } = data;
  let request: { id: string };
  try {
    request = await prisma.aiDemandRequest.create({
      data: {
        ...requestData,
        attachments: attachments.length ? JSON.stringify(attachments) : "",
        logs: { create: { action: "需求已提交", actor: requestData.requesterName, detail: `由 ${requestData.requesterDepartment} 提交，等待 AI发展委员会评审` } },
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("Failed to create AI demand request", error);
    return {
      message: "需求暂时无法保存，请稍后重试；如问题持续，请联系网站维护人员。",
      values,
      submissionKey: previousState.submissionKey + 1,
    };
  }

  refreshWorkflow(request.id);
  redirect(`/ai-requests/${request.id}`);
}

export async function reviewAndPublish(requestId: string, formData: FormData) {
  const review = reviewSchema.parse(Object.fromEntries(formData));
  const request = await prisma.aiDemandRequest.findUniqueOrThrow({ where: { id: requestId } });
  if (request.status !== "pending_review") throw new Error("该需求当前不能重复评审发布");

  await prisma.$transaction(async (tx) => {
    await tx.category.upsert({
      where: { slug: "ai-recruitment" },
      update: { name: "AI 项目招募", icon: "users", order: 20 },
      create: { name: "AI 项目招募", slug: "ai-recruitment", icon: "users", order: 20 },
    });
    const postData = {
      title: `AI 项目招募｜${request.title}`,
      content: recruitmentContent(request, review),
      excerpt: `${request.requesterDepartment} 发起 AI 应用需求，AI发展委员会核定为 ${review.projectLevel} 级项目，基础积分总包 ${review.basePointPool.toLocaleString("zh-CN")} 分，现公开招募团队成员。`,
      type: "activity",
      category: "ai-recruitment",
      tags: "AI项目招募,AI积分,内部创新,团队协作",
      authorName: `${request.requesterDepartment} × AI发展委员会`,
      isPublished: true,
      eventDate: review.recruitmentDeadline,
      eventLocation: request.requesterDepartment,
      eventLink: `/ai-requests/${requestId}`,
      attachments: request.attachments,
    };
    const post = request.activityPostId
      ? await tx.post.update({ where: { id: request.activityPostId }, data: postData })
      : await tx.post.create({ data: { ...postData, slug: `ai-project-recruitment-${requestId}` } });

    await tx.aiDemandRequest.update({
      where: { id: requestId },
      data: { ...review, status: "recruiting", reviewedAt: new Date(), activityPostId: post.id },
    });
    await tx.aiWorkflowLog.create({
      data: { requestId, action: "AI发展委员会评审通过并发布招募", actor: review.reviewedBy, detail: `${review.projectLevel} 级项目，基础积分总包 ${review.basePointPool} 分，协助人 ${review.committeeAssistant}` },
    });
  });
  refreshWorkflow(requestId);
}

export async function updateCommitteeAssistant(requestId: string, formData: FormData) {
  const committeeAssistant = committeeAssistantSchema.parse(formData.get("committeeAssistant"));
  const request = await prisma.aiDemandRequest.findUniqueOrThrow({ where: { id: requestId }, include: { activityPost: true } });
  if (request.status === "pending_review") throw new Error("请在需求评审时指定AI发展委员会协助人");
  if (request.committeeAssistant === committeeAssistant) return;
  const previousAssistant = request.committeeAssistant || "未指定";

  await prisma.$transaction(async (tx) => {
    await tx.aiDemandRequest.update({ where: { id: requestId }, data: { committeeAssistant } });
    if (request.activityPost && request.projectLevel && request.basePointPool) {
      await tx.post.update({
        where: { id: request.activityPost.id },
        data: { content: recruitmentContent(request, { projectLevel: request.projectLevel, basePointPool: request.basePointPool, committeeAssistant }) },
      });
    }
    await tx.aiWorkflowLog.create({
      data: { requestId, action: "更新AI发展委员会协助人", actor: "AI发展委员会", detail: `${previousAssistant} → ${committeeAssistant}` },
    });
  });
  refreshWorkflow(requestId);
}

export async function submitApplication(requestId: string, formData: FormData) {
  const data = aiProjectApplicationSchema.parse(Object.fromEntries(formData));
  const request = await prisma.aiDemandRequest.findUniqueOrThrow({ where: { id: requestId } });
  if (request.status !== "recruiting") throw new Error("该项目当前不在招募阶段");

  await prisma.$transaction(async (tx) => {
    await tx.aiProjectApplication.upsert({
      where: { requestId_email: { requestId, email: data.email } },
      update: { ...data, status: "pending" },
      create: { ...data, requestId },
    });
    await tx.aiWorkflowLog.create({ data: { requestId, action: "收到项目报名", actor: data.name, detail: `${data.department} · ${data.intendedRole}` } });
  });
  refreshWorkflow(requestId);
}

export async function updateApplicationStatus(applicationId: string, requestId: string, status: string, _formData: FormData) {
  void _formData;
  const nextStatus = z.enum(["pending", "reserve", "selected", "rejected"]).parse(status);
  const request = await prisma.aiDemandRequest.findUniqueOrThrow({ where: { id: requestId } });
  if (request.status !== "recruiting") throw new Error("该项目当前不能调整报名状态");
  const application = await prisma.aiProjectApplication.findUniqueOrThrow({ where: { id: applicationId } });
  if (application.requestId !== requestId) throw new Error("报名记录与当前项目不匹配");
  await prisma.aiProjectApplication.update({ where: { id: applicationId }, data: { status: nextStatus } });
  await prisma.aiWorkflowLog.create({ data: { requestId, action: "更新报名状态", actor: "需求方/项目负责人", detail: `${application.name}：${nextStatus}` } });
  refreshWorkflow(requestId);
}

export async function confirmTeam(requestId: string, formData: FormData) {
  const leadApplicationId = z.string().min(1).parse(formData.get("leadApplicationId"));
  const request = await prisma.aiDemandRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { applications: { where: { status: "selected" } }, project: true },
  });
  if (request.status !== "recruiting") throw new Error("该项目当前不能确认团队");
  if (request.applications.length === 0) throw new Error("请先将至少一名报名人标记为已入选");
  const lead = request.applications.find((application) => application.id === leadApplicationId);
  if (!lead) throw new Error("项目负责人必须来自已入选人员");

  await prisma.$transaction(async (tx) => {
    for (const application of request.applications) {
      await tx.aiProjectTeamMember.create({
        data: {
          requestId,
          applicationId: application.id,
          name: application.name,
          department: application.department,
          email: application.email,
          role: application.intendedRole,
          responsibility: application.skills,
          isLead: application.id === leadApplicationId,
        },
      });
    }
    const lastProject = await tx.aiProject.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
    await tx.aiProject.create({
      data: {
        requestId,
        name: request.title,
        subtitle: request.desiredFunctions,
        businessImpact: request.businessValue,
        owner: lead.name,
        releasePlan: request.targetDate ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(request.targetDate) : "待团队确认",
        status: "planning",
        order: (lastProject?.order ?? 0) + 1,
      },
    });
    await tx.aiDemandRequest.update({ where: { id: requestId }, data: { status: "team_confirmed" } });
    await tx.aiWorkflowLog.create({ data: { requestId, action: "团队已确认并进入 AI 看板", actor: lead.name, detail: `团队共 ${request.applications.length} 人` } });
  });
  refreshWorkflow(requestId);
}

const transitions = {
  developing: { from: "team_confirmed", projectStatus: "developing", action: "项目进入开发阶段" },
  trial: { from: "developing", projectStatus: "evaluating", action: "项目进入试用评估" },
  delivered_pending_review: { from: "trial", projectStatus: "delivered", action: "项目已交付，等待AI发展委员会结题评审" },
} as const;

export async function advanceProjectStage(requestId: string, targetStatus: string, formData: FormData) {
  const target = z.enum(["developing", "trial", "delivered_pending_review"]).parse(targetStatus);
  const actor = z.string().trim().min(1).max(80).parse(formData.get("actor"));
  const transition = transitions[target];
  const request = await prisma.aiDemandRequest.findUniqueOrThrow({ where: { id: requestId }, include: { project: true } });
  if (request.status !== transition.from || !request.project) throw new Error("项目当前状态不允许执行该操作");
  await prisma.$transaction([
    prisma.aiDemandRequest.update({ where: { id: requestId }, data: { status: target } }),
    prisma.aiProject.update({ where: { id: request.project.id }, data: { status: transition.projectStatus } }),
    prisma.aiWorkflowLog.create({ data: { requestId, action: transition.action, actor } }),
  ]);
  refreshWorkflow(requestId);
}

export async function scoreProject(requestId: string, formData: FormData) {
  const data = z.object({
    effectCoefficient: z.coerce.number().refine(
      (value) => effectCoefficientValues.some((coefficient) => coefficient === value),
      "请选择激励政策规定的成效系数",
    ),
    leadName: z.string().trim().min(1).max(50),
    leadDepartment: z.string().trim().min(1).max(80),
    leadEmail: emailSchema,
    leadRole: z.string().trim().min(1).max(100),
    reviewedBy: z.string().trim().min(1).max(80),
    comment: z.string().trim().min(3).max(2000),
  }).parse(Object.fromEntries(formData));
  const request = await prisma.aiDemandRequest.findUniqueOrThrow({ where: { id: requestId }, include: { teamMembers: true, project: true } });
  if (request.status !== "delivered_pending_review" || !request.basePointPool) throw new Error("该项目当前不能进行结题评分");
  const finalPointPool = Math.round(request.basePointPool * data.effectCoefficient);
  const leadByEmail = request.teamMembers.find((member) => member.email === data.leadEmail);
  const currentLead = request.teamMembers.find((member) => member.isLead);

  await prisma.$transaction(async (tx) => {
    await tx.aiProjectTeamMember.updateMany({ where: { requestId }, data: { isLead: false } });
    if (leadByEmail) {
      await tx.aiProjectTeamMember.update({
        where: { id: leadByEmail.id },
        data: { name: data.leadName, department: data.leadDepartment, role: data.leadRole, isLead: true },
      });
    } else if (currentLead) {
      await tx.aiProjectTeamMember.update({
        where: { id: currentLead.id },
        data: { name: data.leadName, department: data.leadDepartment, email: data.leadEmail, role: data.leadRole, isLead: true },
      });
    } else {
      await tx.aiProjectTeamMember.create({
        data: { requestId, name: data.leadName, department: data.leadDepartment, email: data.leadEmail, role: data.leadRole, isLead: true },
      });
    }
    if (request.project) await tx.aiProject.update({ where: { id: request.project.id }, data: { owner: data.leadName } });
    await tx.aiDemandRequest.update({
      where: { id: requestId },
      data: {
        status: "scored_pending_allocation",
        score: null,
        effectCoefficient: data.effectCoefficient,
        finalPointPool,
        reviewedBy: data.reviewedBy,
        reviewedAt: new Date(),
        reviewComment: `${request.reviewComment}\n结题评语：${data.comment}`.trim(),
      },
    });
    await tx.aiWorkflowLog.create({
      data: {
        requestId,
        action: "AI发展委员会确认结题成效系数",
        actor: data.reviewedBy,
        detail: `主要负责人 ${data.leadName}，成效系数 ${data.effectCoefficient}，最终积分 ${finalPointPool}`,
      },
    });
  });
  refreshWorkflow(requestId);
}

export type PointAllocationActionState = { error: string; success: string };

export async function proposePointAllocation(
  requestId: string,
  _previousState: PointAllocationActionState,
  formData: FormData,
): Promise<PointAllocationActionState> {
  try {
    await persistPointAllocation(requestId, formData);
    return { error: "", success: "积分分配已保存，积分差额已同步更新" };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0]?.message
      : error instanceof Error ? error.message : "积分分配保存失败，请稍后重试";
    return { error: message || "积分分配信息不完整，请检查后重试", success: "" };
  }
}

async function persistPointAllocation(requestId: string, formData: FormData) {
  const request = await prisma.aiDemandRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { teamMembers: true },
  });
  const isRevision = request.status === "warranty";
  if (!request.finalPointPool || (!isRevision && request.status !== "scored_pending_allocation")) {
    throw new Error("该项目当前不能提交或修改积分分配");
  }
  const finalPointPool = request.finalPointPool;

  function ratioTenths(value: FormDataEntryValue | null) {
    const ratio = z.coerce.number().min(0.1).max(100).parse(value);
    const tenths = Math.round(ratio * 10);
    if (Math.abs(tenths / 10 - ratio) > 0.00001) throw new Error("积分分配比例最多保留一位小数");
    return tenths;
  }

  const requestedMemberIds = formData.getAll("existingMemberId").map((value) => z.string().min(1).parse(value));
  if (new Set(requestedMemberIds).size !== requestedMemberIds.length) throw new Error("参与人员信息重复，请刷新页面后重试");
  const requestMemberIds = new Set(request.teamMembers.map((member) => member.id));
  if (requestedMemberIds.some((memberId) => !requestMemberIds.has(memberId))) throw new Error("参与人员信息无效，请刷新页面后重试");
  const retainedMembers = request.teamMembers.filter((member) => requestedMemberIds.includes(member.id));
  const removedMembers = request.teamMembers.filter((member) => !requestedMemberIds.includes(member.id));
  if (removedMembers.some((member) => member.isLead)) throw new Error("主要负责人不能从积分分配中删除");
  if (!isRevision && removedMembers.length > 0) throw new Error("首次分配不能删除已确认的项目成员");

  const existingAllocations = retainedMembers.map((member) => ({
    member,
    ratioTenths: ratioTenths(formData.get(`ratio-${member.id}`)),
  }));
  const historicalKeys = formData.getAll("historicalKey").map((value) => z.string().regex(/^\d+$/).parse(value));
  const historicalMembers = historicalKeys.map((key) => ({
    name: z.string().trim().min(1).max(50).parse(formData.get(`historicalName-${key}`)),
    department: z.string().trim().min(1).max(80).parse(formData.get(`historicalDepartment-${key}`)),
    email: emailSchema.parse(formData.get(`historicalEmail-${key}`)),
    role: z.string().trim().min(1).max(100).parse(formData.get(`historicalRole-${key}`)),
    responsibility: z.string().trim().max(1000).parse(formData.get(`historicalResponsibility-${key}`) ?? ""),
    ratioTenths: ratioTenths(formData.get(`historicalRatio-${key}`)),
  }));
  const emails = [...request.teamMembers.map((member) => member.email), ...historicalMembers.map((member) => member.email)];
  if (new Set(emails).size !== emails.length) throw new Error("同一项目中企业邮箱不能重复");
  if (existingAllocations.length + historicalMembers.length === 0) throw new Error("请至少添加一名积分分配人员");
  const totalRatioTenths = [...existingAllocations, ...historicalMembers].reduce((sum, allocation) => sum + allocation.ratioTenths, 0);
  if (totalRatioTenths !== 1000) throw new Error("个人积分分配比例合计必须等于 100%");

  const proposer = z.string().trim().min(1).max(80).parse(formData.get("proposer"));
  const allocationNote = z.string().trim().min(3).max(2000).parse(formData.get("allocationNote"));

  await prisma.$transaction(async (tx) => {
    const currentRequest = await tx.aiDemandRequest.findUniqueOrThrow({ where: { id: requestId }, select: { status: true } });
    if (currentRequest.status !== request.status) throw new Error("项目状态已发生变化，请刷新页面后重试");

    const persistedAllocations = await tx.aiProjectPointAllocation.findMany({ where: { requestId } });
    const previousAllocations = new Map(persistedAllocations.map((allocation) => [allocation.teamMemberId, allocation]));
    const allocationMembers = existingAllocations.map((allocation) => ({ member: allocation.member, ratioTenths: allocation.ratioTenths }));
    for (const historicalMember of historicalMembers) {
      const member = await tx.aiProjectTeamMember.create({
        data: {
          requestId,
          name: historicalMember.name,
          department: historicalMember.department,
          email: historicalMember.email,
          role: historicalMember.role,
          responsibility: historicalMember.responsibility,
        },
      });
      allocationMembers.push({ member, ratioTenths: historicalMember.ratioTenths });
    }
    const calculated = calculatePointAllocations(
      finalPointPool,
      allocationMembers.map((allocation) => ({ key: allocation.member.id, ratioTenths: allocation.ratioTenths })),
    );
    const calculatedByMemberId = new Map(calculated.map((allocation) => [allocation.key, allocation]));

    if (isRevision) {
      for (const member of request.teamMembers) {
        const previous = previousAllocations.get(member.id);
        const next = calculatedByMemberId.get(member.id);
        const delta = (next?.issuedPoints ?? 0) - (previous?.issuedPoints ?? 0);
        if (delta >= 0) continue;
        const pointMember = await tx.aiPointMember.findUnique({ where: { email: member.email } });
        if (!pointMember || pointMember.availablePoints + delta < 0 || pointMember.historicalPoints + delta < 0) {
          throw new Error(`${member.name} 的可用积分不足，无法撤回 ${Math.abs(delta)} 分；请先恢复可用积分后再修改分配`);
        }
        if (!next && previous && (pointMember.completedProjects < 1 || (request.effectCoefficient && request.effectCoefficient >= 1.5 && pointMember.highImpactProjects < 1))) {
          throw new Error(`${member.name} 的积分档案不完整，暂时不能删除；请联系 AI发展委员会核对`);
        }
      }
    }

    await tx.aiProjectPointAllocation.deleteMany({ where: { requestId } });

    for (const removedMember of removedMembers) {
      const previous = previousAllocations.get(removedMember.id);
      if (previous) {
        const pointMember = await tx.aiPointMember.findUniqueOrThrow({ where: { email: removedMember.email } });
        await tx.aiPointMember.update({
          where: { id: pointMember.id },
          data: {
            historicalPoints: { decrement: previous.issuedPoints },
            availablePoints: { decrement: previous.issuedPoints },
            completedProjects: { decrement: 1 },
            highImpactProjects: { decrement: request.effectCoefficient && request.effectCoefficient >= 1.5 ? 1 : 0 },
          },
        });
        await tx.aiPointEntry.create({
          data: {
            memberId: pointMember.id,
            historicalDelta: -previous.issuedPoints,
            availableDelta: -previous.issuedPoints,
            reason: "项目负责人删除参与人，撤回首期 70% AI 积分",
            projectName: request.title,
            operatorName: proposer,
          },
        });
      }
      await tx.aiProjectTeamMember.delete({ where: { id: removedMember.id } });
    }

    for (const { member: memberData, ratioTenths: memberRatioTenths } of allocationMembers) {
      const allocation = calculatedByMemberId.get(memberData.id)!;
      const previous = previousAllocations.get(memberData.id);
      const pointDelta = allocation.issuedPoints - (previous?.issuedPoints ?? 0);
      await tx.aiProjectPointAllocation.create({
        data: {
          requestId,
          teamMemberId: memberData.id,
          proposedPoints: allocation.proposedPoints,
          ratioTenths: memberRatioTenths,
          issuedPoints: allocation.issuedPoints,
          warrantyPoints: allocation.warrantyPoints,
        },
      });
      let pointMember = await tx.aiPointMember.findUnique({ where: { email: memberData.email } });
      if (!pointMember) {
        pointMember = await tx.aiPointMember.create({ data: { name: memberData.name, email: memberData.email, department: memberData.department } });
      }
      await tx.aiPointMember.update({
        where: { id: pointMember.id },
        data: {
          name: memberData.name,
          department: memberData.department,
          historicalPoints: { increment: pointDelta },
          availablePoints: { increment: pointDelta },
          completedProjects: { increment: previous ? 0 : 1 },
          ledProjects: { increment: previous ? 0 : memberData.isLead ? 1 : 0 },
          highImpactProjects: { increment: previous ? 0 : request.effectCoefficient && request.effectCoefficient >= 1.5 ? 1 : 0 },
        },
      });
      if (!isRevision || pointDelta !== 0) {
        await tx.aiPointEntry.create({
          data: {
            memberId: pointMember.id,
            historicalDelta: pointDelta,
            availableDelta: pointDelta,
            reason: isRevision ? "项目负责人修改分配，调整首期 70% AI 积分" : "项目负责人完成分配，发放 70% AI 积分",
            projectName: request.title,
            operatorName: proposer,
          },
        });
      }
    }
    await tx.aiDemandRequest.update({ where: { id: requestId }, data: { status: "warranty", allocationNote, pointsApprovedBy: proposer, pointsApprovedAt: new Date() } });
    const targetInitial = calculated.reduce((sum, allocation) => sum + allocation.issuedPoints, 0);
    await tx.aiWorkflowLog.create({
      data: {
        requestId,
        action: isRevision ? "项目负责人修改积分分配" : "项目负责人完成积分分配并进入质保",
        actor: proposer,
        detail: isRevision
          ? `${allocationMembers.length} 人的分配方案已更新${removedMembers.length ? `，删除 ${removedMembers.length} 人` : ""}，首期积分按差额同步调整，首期总额仍为 ${targetInitial} 分`
          : `${allocationMembers.length} 人按比例分配，首期发放 ${targetInitial} 分，已自动进入积分榜`,
      },
    });
  });
  refreshWorkflow(requestId);
}

export async function completeWarranty(requestId: string, formData: FormData) {
  const actor = z.string().trim().min(1).max(80).parse(formData.get("actor"));
  const request = await prisma.aiDemandRequest.findUniqueOrThrow({ where: { id: requestId }, include: { allocations: { include: { teamMember: true } }, project: true } });
  if (request.status !== "warranty") throw new Error("该项目当前不在质保积分发放阶段");
  const warrantyTotal = request.allocations.reduce((sum, allocation) => sum + allocation.warrantyPoints, 0);

  await prisma.$transaction(async (tx) => {
    for (const allocation of request.allocations) {
      if (allocation.warrantyPoints <= 0) continue;
      const pointMember = await tx.aiPointMember.findUniqueOrThrow({ where: { email: allocation.teamMember.email } });
      await tx.aiPointMember.update({ where: { id: pointMember.id }, data: { historicalPoints: { increment: allocation.warrantyPoints }, availablePoints: { increment: allocation.warrantyPoints } } });
      await tx.aiPointEntry.create({ data: { memberId: pointMember.id, historicalDelta: allocation.warrantyPoints, availableDelta: allocation.warrantyPoints, reason: "质保期结束发放 30% AI 积分", projectName: request.title, operatorName: actor } });
      await tx.aiProjectPointAllocation.update({ where: { id: allocation.id }, data: { issuedPoints: { increment: allocation.warrantyPoints }, warrantyPoints: 0 } });
    }
    await tx.aiDemandRequest.update({ where: { id: requestId }, data: { status: "completed" } });
    if (request.project) await tx.aiProject.update({ where: { id: request.project.id }, data: { status: "delivered" } });
    await tx.aiWorkflowLog.create({ data: { requestId, action: "质保完成并发放剩余积分", actor, detail: `发放 ${warrantyTotal} 分，项目正式结题` } });
  });
  refreshWorkflow(requestId);
}
