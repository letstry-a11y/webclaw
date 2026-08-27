import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, isAllowedCompanyEmail, normalizeCompanyEmail, setSessionCookie, signUserToken } from "@/lib/auth";
import { verifyEmailCode } from "@/lib/verification";

const schema = z.object({
  name: z.string().trim().min(1).max(50), department: z.string().trim().min(1).max(80),
  email: z.string().email().max(120), password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128), code: z.string().regex(/^\d{6}$/),
}).refine((data) => data.password === data.confirmPassword, { message: "两次输入的密码不一致", path: ["confirmPassword"] });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "注册信息无效" }, { status: 400 });
  const email = normalizeCompanyEmail(parsed.data.email);
  if (!isAllowedCompanyEmail(email)) return NextResponse.json({ error: "仅支持公司企业邮箱注册" }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  const verification = await verifyEmailCode(email, "register", parsed.data.code);
  if (!verification) return NextResponse.json({ error: "验证码无效或已过期" }, { status: 400 });
  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({ data: {
      name: parsed.data.name, department: parsed.data.department, email, passwordHash,
    } });
    await tx.emailVerificationCode.update({ where: { id: verification.id }, data: { usedAt: new Date() } });
    await tx.auditLog.create({ data: {
      userId: created.id, actorName: created.name, actorEmail: created.email,
      action: "企业账号注册", targetType: "User", targetId: created.id,
    } });
    return created;
  });
  await setSessionCookie(await signUserToken({ ...user, role: "employee" }));
  return NextResponse.json({ success: true });
}
