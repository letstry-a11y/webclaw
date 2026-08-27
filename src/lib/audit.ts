import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth";

export async function writeAuditLog(user: AuthUser, action: string, options: {
  targetType?: string; targetId?: string; detail?: string;
} = {}) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("cf-connecting-ip")
    || requestHeaders.get("x-forwarded-for")?.split(",")[0]
    || requestHeaders.get("x-real-ip") || "";
  await prisma.auditLog.create({ data: {
    userId: user.id, actorName: user.name, actorEmail: user.email, action,
    targetType: options.targetType || "", targetId: options.targetId || "",
    detail: options.detail || "", ipAddress: ip.trim().slice(0, 80),
  } });
}
