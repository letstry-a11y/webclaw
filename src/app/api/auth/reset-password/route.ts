import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, normalizeCompanyEmail } from "@/lib/auth";
import { verifyEmailCode } from "@/lib/verification";

const schema = z.object({ email: z.string().email().max(120), code: z.string().regex(/^\d{6}$/), password: z.string().min(8).max(128), confirmPassword: z.string().min(8).max(128) })
  .refine((data) => data.password === data.confirmPassword, { message: "两次输入的密码不一致" });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "重置信息无效" }, { status: 400 });
  const email = normalizeCompanyEmail(parsed.data.email);
  const user = await prisma.user.findUnique({ where: { email } });
  const verification = await verifyEmailCode(email, "reset", parsed.data.code);
  if (!user || !verification) return NextResponse.json({ error: "验证码无效或已过期" }, { status: 400 });
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password), sessionVersion: { increment: 1 }, failedLoginAttempts: 0, lockedUntil: null } }),
    prisma.emailVerificationCode.update({ where: { id: verification.id }, data: { usedAt: new Date() } }),
    prisma.auditLog.create({ data: { userId: user.id, actorName: user.name, actorEmail: user.email, action: "重置登录密码", targetType: "User", targetId: user.id } }),
  ]);
  return NextResponse.json({ success: true });
}
