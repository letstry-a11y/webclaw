import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAllowedCompanyEmail, normalizeCompanyEmail, setSessionCookie, rememberDevice, trustedDevice, verifyPassword } from "@/lib/auth";
import { validActivation } from "../../../../../scripts/company-credentials.mjs";

const schema = z.object({ email: z.string().trim().min(1).max(120), password: z.string().min(1).max(128), activation: z.string().max(100).optional() });
const denied = () => NextResponse.json({ error: "请核对账号、密码和审批状态。使用初始密码时，请在此浏览器打开管理员提供的个人激活链接。" }, { status: 401 });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return denied();
  const account = normalizeCompanyEmail(parsed.data.email);
  if (account !== "admin" && !isAllowedCompanyEmail(account)) return denied();
  const user = await prisma.user.findUnique({ where: account === "admin" ? { loginAlias: account } : { email: account } });
  if (!user || user.status !== "approved" || !isAllowedCompanyEmail(user.email)) return denied();
  if (user.activationHash && !validActivation(parsed.data.activation, user.activationHash) && !await trustedDevice(user)) return denied();
  if (user.lockedUntil && user.lockedUntil > new Date()) return NextResponse.json({ error: "请在 15 分钟后再试" }, { status: 429 });
  const version = { id: user.id, sessionVersion: user.sessionVersion, status: "approved" };
  if (!await verifyPassword(parsed.data.password, user.passwordHash)) {
    await prisma.$transaction(async tx => {
      const failure = await tx.user.updateMany({ where: version, data: { failedLoginAttempts: { increment: 1 } } });
      if (failure.count) await tx.user.updateMany({ where: { ...version, failedLoginAttempts: { gte: 5 } },
        data: { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + 15 * 60000) } });
    });
    return denied();
  }
  const updated = await prisma.user.updateMany({ where: version, data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } });
  if (!updated.count) return denied();
  if (user.activationHash) await rememberDevice(user);
  await setSessionCookie(user);
  return NextResponse.json({ success: true });
}
