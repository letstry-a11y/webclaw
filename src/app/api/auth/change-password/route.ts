import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DEVICE_COOKIE, getCurrentUser, hashPassword, setSessionCookie, verifyPassword } from "@/lib/auth";

const schema = z.object({ currentPassword: z.string().min(1).max(128), password: z.string().min(8).max(128), confirmPassword: z.string().max(128) })
  .refine(data => data.password === data.confirmPassword && data.password !== data.currentPassword);
export async function POST(request: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.password === process.env.INITIAL_USER_PASSWORD) return NextResponse.json({ error: "请设置至少 8 位的新密码，并两次输入相同的密码" }, { status: 400 });
  const stored = await prisma.user.findUniqueOrThrow({ where: { id: current.id }, select: { passwordHash: true } });
  if (!await verifyPassword(parsed.data.currentPassword, stored.passwordHash)) return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
  const updated = await prisma.user.updateMany({ where: { id: current.id, sessionVersion: current.sessionVersion, status: "approved" },
    data: { passwordHash: await hashPassword(parsed.data.password), activationHash: null, sessionVersion: { increment: 1 }, failedLoginAttempts: 0, lockedUntil: null } });
  if (!updated.count) return NextResponse.json({ error: "账号状态有变化，请重新登录" }, { status: 409 });
  (await cookies()).delete(DEVICE_COOKIE);
  await setSessionCookie({ ...current, sessionVersion: current.sessionVersion + 1 });
  return NextResponse.json({ success: true });
}
