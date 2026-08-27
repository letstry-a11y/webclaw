import { prisma } from "@/lib/prisma";
import { hashVerificationCode, normalizeCompanyEmail } from "@/lib/auth";

export async function verifyEmailCode(emailValue: string, purpose: "register" | "reset", code: string) {
  const email = normalizeCompanyEmail(emailValue);
  const record = await prisma.emailVerificationCode.findFirst({
    where: { email, purpose, usedAt: null }, orderBy: { createdAt: "desc" },
  });
  if (!record || record.expiresAt <= new Date() || record.attempts >= 5) return null;
  if (record.codeHash !== hashVerificationCode(email, purpose, code)) {
    await prisma.emailVerificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return null;
  }
  return record;
}
