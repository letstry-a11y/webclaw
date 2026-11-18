import { prisma } from "./prisma";

export async function settleWarrantyPoints(requestId: string, actor: string) {
  await prisma.$transaction(async (tx) => {
    const changed = await tx.aiDemandRequest.updateMany({ where: { id: requestId, status: "warranty" }, data: { status: "completed" } });
    if (!changed.count) return;
    const request = await tx.aiDemandRequest.findUniqueOrThrow({ where: { id: requestId }, include: { allocations: { include: { teamMember: true } }, project: true } });
    const warrantyTotal = request.allocations.reduce((sum, allocation) => sum + allocation.warrantyPoints, 0);
    for (const allocation of request.allocations) {
      if (allocation.warrantyPoints <= 0) continue;
      const pointMember = await tx.aiPointMember.findUniqueOrThrow({ where: { email: allocation.teamMember.email } });
      await tx.aiPointMember.update({ where: { id: pointMember.id }, data: { historicalPoints: { increment: allocation.warrantyPoints }, availablePoints: { increment: allocation.warrantyPoints } } });
      await tx.aiPointEntry.create({ data: { memberId: pointMember.id, historicalDelta: allocation.warrantyPoints, availableDelta: allocation.warrantyPoints, reason: "质保期结束发放 30% AI 积分", projectName: request.title, operatorName: actor } });
      await tx.aiProjectPointAllocation.update({ where: { id: allocation.id }, data: { issuedPoints: { increment: allocation.warrantyPoints }, warrantyPoints: 0 } });
    }
    if (request.project) await tx.aiProject.update({ where: { id: request.project.id }, data: { status: "delivered" } });
    await tx.aiWorkflowLog.create({ data: { requestId, action: "质保完成并发放剩余积分", actor, detail: `发放 ${warrantyTotal} 分，项目正式结题` } });
  });
}
