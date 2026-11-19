import type { Prisma } from "@prisma/client";

export const projectLeadSelection = {
  where: { isLead: true },
  orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  select: { name: true },
} satisfies Prisma.AiProjectTeamMemberFindManyArgs;

export function projectOwnerNames(leads: { name: string }[] = [], fallback?: string | null) {
  const names = leads.map((lead) => lead.name.trim()).filter(Boolean);
  const legacyOwner = fallback?.trim();
  return names.length || !legacyOwner ? names : [legacyOwner];
}
