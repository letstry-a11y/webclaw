import { PrismaClient } from "@prisma/client";
import { createActivation, hashPassword, isAllowedCompanyEmail, normalizeCompanyEmail } from "./company-credentials.mjs";

const db = new PrismaClient();
try {
  const email = normalizeCompanyEmail(process.env.COMPANY_ADMIN_EMAIL || "");
  const name = process.env.COMPANY_ADMIN_NAME?.trim();
  const department = process.env.COMPANY_ADMIN_DEPARTMENT?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const origin = new URL(process.env.PUBLIC_BASE_URL || "");
  if (!name || !department || !isAllowedCompanyEmail(email) || !password || password.length > 128 || origin.protocol !== "https:") {
    throw new Error("请设置企业管理员邮箱、姓名、部门、初始密码和 HTTPS 公网地址。");
  }
  const activation = createActivation();
  const passwordHash = await hashPassword(password);
  await db.$transaction(async tx => {
    if (await tx.user.count({ where: { role: "admin", status: "approved" } })) throw new Error("已有审批管理员，初始化已停止。");
    const pending = await tx.user.findUnique({ where: { email } });
    const data = { name, department, loginAlias: "admin", role: "admin", status: "approved", passwordHash, activationHash: activation.hash, failedLoginAttempts: 0, lockedUntil: null };
    if (pending) await tx.user.update({ where: { id: pending.id }, data: { ...data, sessionVersion: { increment: 1 } } });
    else await tx.user.create({ data: { ...data, email } });
  });
  // The calling operator stores this output privately for the designated administrator.
  process.stdout.write(new URL("/login#activation=" + activation.token, origin).href + "\n");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
