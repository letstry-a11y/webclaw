import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashVerificationCode, isAllowedCompanyEmail, normalizeCompanyEmail } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().email().max(120), purpose: z.enum(["register", "reset"]) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "请输入有效的企业邮箱" }, { status: 400 });
  const email = normalizeCompanyEmail(parsed.data.email);
  if (!isAllowedCompanyEmail(email)) return NextResponse.json({ error: "仅支持公司企业邮箱注册" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email } });
  if (parsed.data.purpose === "register" && user) return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  if (parsed.data.purpose === "reset" && !user) return NextResponse.json({ success: true });

  const recent = await prisma.emailVerificationCode.findFirst({
    where: { email, purpose: parsed.data.purpose, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (recent) return NextResponse.json({ error: "验证码发送过于频繁，请一分钟后再试" }, { status: 429 });
  const dailyCount = await prisma.emailVerificationCode.count({
    where: { email, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  if (dailyCount >= 10) return NextResponse.json({ error: "今日验证码发送次数已达上限" }, { status: 429 });

  const code = String(randomInt(100000, 1000000));
  await sendVerificationEmail(email, code, parsed.data.purpose);
  await prisma.emailVerificationCode.create({ data: {
    email, purpose: parsed.data.purpose, codeHash: hashVerificationCode(email, parsed.data.purpose, code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  } });
  return NextResponse.json({
    success: true,
    ...(process.env.NODE_ENV !== "production" && process.env.AUTH_EMAIL_MODE === "console" ? { developmentCode: code } : {}),
  });
}
