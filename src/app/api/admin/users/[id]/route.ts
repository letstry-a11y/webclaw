import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isAllowedCompanyEmail, hashPassword } from "@/lib/auth";
import { createActivation } from "../../../../../../scripts/company-credentials.mjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({ action: z.enum(["approve", "reject", "reset"]), version: z.number().int().positive() });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "admin") return NextResponse.json({ error: "仅管理员可操作" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "无效操作" }, { status: 400 });
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!user || !isAllowedCompanyEmail(user.email)) return NextResponse.json({ error: "未找到企业用户" }, { status: 404 });
  if (id === actor.id) return NextResponse.json({ error: "请在我的账号中修改自己的密码" }, { status: 400 });
  const { action, version } = parsed.data;
  const where = { id, status: action === "reset" ? "approved" : "pending", sessionVersion: version };
  const stale = () => NextResponse.json({ error: "账号状态已变化，请刷新后重试" }, { status: 409 });
  if (action === "reject") {
    const result = await prisma.user.updateMany({ where, data: { status: "rejected", sessionVersion: { increment: 1 } } });
    return result.count ? NextResponse.json({ message: "已驳回注册申请" }) : stale();
  }
  const password = process.env.INITIAL_USER_PASSWORD;
  if (!password) return NextResponse.json({ error: "尚未配置员工初始密码" }, { status: 503 });
  const activation = createActivation();
  const result = await prisma.user.updateMany({ where, data: { status: "approved", passwordHash: await hashPassword(password),
    activationHash: activation.hash, sessionVersion: { increment: 1 }, lockedUntil: null, failedLoginAttempts: 0 } });
  if (!result.count) return stale();
  const link = "/login#activation=" + activation.token;
  return NextResponse.json({ message: action === "reset" ? "密码已重置，旧会话和旧激活链接已失效。" : "账号已批准。",
    activationLink: process.env.PUBLIC_BASE_URL ? new URL(link, process.env.PUBLIC_BASE_URL).href : link }, { headers: { "Cache-Control": "private, no-store" } });
}
