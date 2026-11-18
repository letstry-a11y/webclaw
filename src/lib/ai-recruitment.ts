import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ActiveRecruitment = Prisma.AiDemandRequestGetPayload<{ include: { activityPost: true } }>;

export function getActiveRecruitments(take?: number) {
  return prisma.aiDemandRequest.findMany({
    where: {
      status: "recruiting",
      activityPost: { is: { isPublished: true } },
    },
    orderBy: [{ basePointPool: "desc" }, { recruitmentDeadline: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
    take,
    include: { activityPost: true },
  });
}
