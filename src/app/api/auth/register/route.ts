import { NextResponse } from "next/server";
import { z } from "zod";
import { isAllowedCompanyEmail, normalizeCompanyEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(1).max(50), department: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(120).transform(normalizeCompanyEmail).refine(isAllowedCompanyEmail),
});
export async function POST(request: Request) {
  const data = schema.safeParse(await request.json().catch(() => null));
  if (!data.success) return NextResponse.json({ error: "请填写姓名、部门和有效的公司邮箱" }, { status: 400 });
  await prisma.$transaction(async tx => {
    const user = await tx.user.upsert({ where: { email: data.data.email }, create: data.data, update: {}, select: { id: true, status: true } });
    if (user.status === "rejected") await tx.user.updateMany({ where: { id: user.id, status: "rejected" },
      data: { name: data.data.name, department: data.data.department, status: "pending", sessionVersion: { increment: 1 } } });
  });
  return NextResponse.json({ success: true, message: "申请已收到。管理员核对身份后会通过公司内部渠道发送个人激活链接。" });
}
