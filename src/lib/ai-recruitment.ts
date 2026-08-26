import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ActiveRecruitment = Prisma.AiDemandRequestGetPayload<{ include: { activityPost: true } }>;

export function getActiveRecruitments(take = 3) {
  return prisma.aiDemandRequest.findMany({
    where: {
      status: "recruiting",
      recruitmentDeadline: { gte: new Date() },
      activityPost: { is: { isPublished: true } },
    },
    orderBy: [{ recruitmentDeadline: "asc" }, { updatedAt: "desc" }],
    take,
    include: { activityPost: true },
  });
}
