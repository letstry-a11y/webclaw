import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeCompanyEmail, setSessionCookie, signUserToken, USER_ROLES, verifyPassword, type UserRole } from "@/lib/auth";

const schema = z.object({ email: z.string().email().max(120), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  const email = normalizeCompanyEmail(parsed.data.email);
  const user = await prisma.user.findUnique({ where: { email } });
  const ipAddress = (request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "").trim().slice(0, 80);
  if (!user || !user.isActive) {
    await prisma.auditLog.create({ data: { userId: user?.id, actorName: user?.name || "未知账号", actorEmail: email, action: "账号登录失败", targetType: "User", targetId: user?.id || "", detail: user ? "账号已停用" : "账号不存在", ipAddress } });
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) return NextResponse.json({ error: "登录失败次数过多，请稍后再试" }, { status: 423 });
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    const attempts = user.failedLoginAttempts + 1;
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: attempts >= 5 ? 0 : attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null } }),
      prisma.auditLog.create({ data: { userId: user.id, actorName: user.name, actorEmail: user.email, action: "账号登录失败", targetType: "User", targetId: user.id, detail: attempts >= 5 ? "连续失败，账号临时锁定" : `连续失败 ${attempts} 次`, ipAddress } }),
    ]);
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
  }
  const role = USER_ROLES.includes(user.role as UserRole) ? user.role as UserRole : "employee";
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } }),
    prisma.auditLog.create({ data: { userId: user.id, actorName: user.name, actorEmail: user.email, action: "账号登录", targetType: "User", targetId: user.id } }),
  ]);
  await setSessionCookie(await signUserToken({ ...user, role }));
  return NextResponse.json({ success: true });
}
