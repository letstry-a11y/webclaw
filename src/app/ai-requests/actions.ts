"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { effectCoefficientValues } from "@/lib/ai-project-workflow";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(120).transform((value) => value.toLowerCase());
const optionalDate = z.string().trim().transform((value) => value ? new Date(`${value}T00:00:00+08:00`) : null);

const requestSchema = z.object({
  title: z.string().trim().min(3).max(120),
  requesterName: z.string().trim().min(1).max(50),
  requesterDepartment: z.string().trim().min(1).max(80),
  requesterEmail: emailSchema,
  background: z.string().trim().min(10).max(3000),
  currentProblem: z.string().trim().min(10).max(3000),
  desiredFunctions: z.string().trim().min(10).max(3000),
  businessValue: z.string().trim().min(10).max(3000),
  expectedDeliverables: z.string().trim().min(3).max(2000),
  targetDate: optionalDate,
  availableResources: z.string().trim().max(2000),
  dataSensitivity: z.enum(["public", "internal", "sensitive"]),
  recruitmentRoles: z.string().trim().min(3).max(2000),
  weeklyCommitment: z.string().trim().max(500),
});

const reviewSchema = z.object({
  projectLevel: z.coerce.number().int().min(1).max(5),
  basePointPool: z.coerce.number().int().min(1).max(1000000),
  recruitmentDeadline: optionalDate.refine((value) => value !== null, "必须填写报名截止日期"),
  plannedTeamSize: z.coerce.number().int().min(1).max(100),
  warrantyMonths: z.coerce.number().int().min(1).max(24),
  reviewedBy: z.string().trim().min(1).max(80),
  reviewComment: z.string().trim().min(3).max(2000),
});

const applicationSchema = z.object({
  name: z.string().trim().min(1).max(50),
  department: z.string().trim().min(1).max(80),
  email: emailSchema,
  intendedRole: z.string().trim().min(1).max(100),
  skills: z.string().trim().min(3).max(2000),
  weeklyAvailability: z.string().trim().min(1).max(200),
  statement: z.string().trim().max(2000),
});

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
}, review: z.infer<typeof reviewSchema>) {
  return `
<div style="border-left:5px solid #4870ff;background:#eef3fb;padding:18px 20px;margin-bottom:28px">
  <p style="margin:0 0 8px"><strong>AI 项目公开招募</strong></p>
  <p style="margin:0">该需求已经 AI 委员会评审，项目等级为 ${review.projectLevel} 级，基础积分总包为 ${review.basePointPool.toLocaleString("zh-CN")} 分。团队确认后将自动进入 AI 项目看板。</p>
</div>
<h2>需求背景</h2><p>${escapeHtml(request.background)}</p>
<h2>当前问题</h2><p>${escapeHtml(request.currentProblem)}</p>
<h2>希望实现的功能</h2><p>${escapeHtml(request.desiredFunctions)}</p>
<h2>预期业务价值</h2><p>${escapeHtml(request.businessValue)}</p>
<h2>预期交付成果</h2><p>${escapeHtml(request.expectedDeliverables)}</p>
<h2>招募岗位与能力要求</h2><p>${escapeHtml(request.recruitmentRoles)}</p>
<h2>时间投入</h2><p>${escapeHtml(request.weeklyCommitment || "以项目团队确认结果为准")}</p>
<h2>需求方与联系方式</h2>
<p><strong>需求部门：</strong>${escapeHtml(request.requesterDepartment)}<br /><strong>需求方：</strong>${escapeHtml(request.requesterName)}<br /><strong>企业邮箱：</strong><a href="mailto:${escapeHtml(request.requesterEmail)}">${escapeHtml(request.requesterEmail)}</a></p>
<blockquote><strong>积分说明：</strong>最终项目总积分 = 基础积分总包 × 结题成效系数。个人积分根据实际贡献提出分配方案，并经 AI 委员会确认后发放。</blockquote>
`;
}

export async function createAiRequest(formData: FormData) {
  const data = requestSchema.parse(Object.fromEntries(formData));
  const request = await prisma.aiDemandRequest.create({
    data: {
      ...data,
      logs: { create: { action: "需求已提交", actor: data.requesterName, detail: `由 ${data.requesterDepartment} 提交，等待 AI 委员会评审` } },
    },
  });
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
      excerpt: `${request.requesterDepartment} 发起 AI 应用需求，委员会核定为 ${review.projectLevel} 级项目，基础积分总包 ${review.basePointPool.toLocaleString("zh-CN")} 分，现公开招募团队成员。`,
      type: "activity",
      category: "ai-recruitment",
      tags: "AI项目招募,AI积分,内部创新,团队协作",
      authorName: `${request.requesterDepartment} × AI 发展委员会`,
      isPublished: true,
      eventDate: review.recruitmentDeadline,
      eventLocation: request.requesterDepartment,
      eventLink: `/ai-requests/${requestId}`,
    };
    const post = request.activityPostId
      ? await tx.post.update({ where: { id: request.activityPostId }, data: postData })
      : await tx.post.create({ data: { ...postData, slug: `ai-project-recruitment-${requestId}` } });

    await tx.aiDemandRequest.update({
      where: { id: requestId },
      data: { ...review, status: "recruiting", reviewedAt: new Date(), activityPostId: post.id },
    });
    await tx.aiWorkflowLog.create({
      data: { requestId, action: "委员会评审通过并发布招募", actor: review.reviewedBy, detail: `${review.projectLevel} 级项目，基础积分总包 ${review.basePointPool} 分` },
    });
  });
  refreshWorkflow(requestId);
}

export async function submitApplication(requestId: string, formData: FormData) {
  const data = applicationSchema.parse(Object.fromEntries(formData));
  const request = await prisma.aiDemandRequest.findUniqueOrThrow({ where: { id: requestId } });
  if (request.status !== "recruiting") throw new Error("该项目当前不在招募阶段");
  if (request.recruitmentDeadline && request.recruitmentDeadline < new Date()) throw new Error("报名已截止");

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
  delivered_pending_review: { from: "trial", projectStatus: "delivered", action: "项目已交付，等待委员会结题评审" },
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
        action: "委员会确认结题成效系数",
        actor: data.reviewedBy,
        detail: `主要负责人 ${data.leadName}，成效系数 ${data.effectCoefficient}，最终积分 ${finalPointPool}`,
      },
    });
  });
  refreshWorkflow(requestId);
}

export async function proposePointAllocation(requestId: string, formData: FormData) {
  const request = await prisma.aiDemandRequest.findUniqueOrThrow({ where: { id: requestId }, include: { teamMembers: true } });
  if (!request.finalPointPool || request.status !== "scored_pending_allocation") throw new Error("该项目当前不能提交积分分配");
  const finalPointPool = request.finalPointPool;

  function ratioTenths(value: FormDataEntryValue | null) {
    const ratio = z.coerce.number().min(0.1).max(100).parse(value);
    const tenths = Math.round(ratio * 10);
    if (Math.abs(tenths / 10 - ratio) > 0.00001) throw new Error("积分分配比例最多保留一位小数");
    return tenths;
  }

  const existingAllocations = request.teamMembers.map((member) => ({
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
    await tx.aiProjectPointAllocation.deleteMany({ where: { requestId } });
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
    const calculated = allocationMembers.map((allocation) => {
      const exactPoints = finalPointPool * allocation.ratioTenths / 1000;
      return { ...allocation, proposedPoints: Math.floor(exactPoints), remainder: exactPoints - Math.floor(exactPoints) };
    });
    let remainingPoints = finalPointPool - calculated.reduce((sum, allocation) => sum + allocation.proposedPoints, 0);
    for (const allocation of [...calculated].sort((a, b) => b.remainder - a.remainder)) {
      if (remainingPoints <= 0) break;
      allocation.proposedPoints += 1;
      remainingPoints -= 1;
    }
    const targetInitial = Math.round(finalPointPool * 0.7);
    const initialPoints = calculated.map((allocation) => Math.floor(allocation.proposedPoints * 0.7));
    initialPoints[initialPoints.length - 1] += targetInitial - initialPoints.reduce((sum, points) => sum + points, 0);

    for (const [index, allocation] of calculated.entries()) {
      const memberData = allocation.member;
      const points = initialPoints[index];
      await tx.aiProjectPointAllocation.create({
        data: {
          requestId,
          teamMemberId: memberData.id,
          proposedPoints: allocation.proposedPoints,
          issuedPoints: points,
          warrantyPoints: allocation.proposedPoints - points,
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
          historicalPoints: { increment: points },
          availablePoints: { increment: points },
          completedProjects: { increment: 1 },
          ledProjects: { increment: memberData.isLead ? 1 : 0 },
          highImpactProjects: { increment: request.effectCoefficient && request.effectCoefficient >= 1.5 ? 1 : 0 },
        },
      });
      await tx.aiPointEntry.create({ data: { memberId: pointMember.id, historicalDelta: points, availableDelta: points, reason: "项目负责人完成分配，发放 70% AI 积分", projectName: request.title, operatorName: proposer } });
    }
    await tx.aiDemandRequest.update({ where: { id: requestId }, data: { status: "warranty", allocationNote, pointsApprovedBy: proposer, pointsApprovedAt: new Date() } });
    await tx.aiWorkflowLog.create({ data: { requestId, action: "项目负责人完成积分分配并进入质保", actor: proposer, detail: `${allocationMembers.length} 人按比例分配，首期发放 ${targetInitial} 分，已自动进入积分榜` } });
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
