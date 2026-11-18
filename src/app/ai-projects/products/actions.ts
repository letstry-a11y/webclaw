"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { progressLogAction } from "@/lib/ai-project-portfolio";
import type { FormResult } from "@/components/ai/ActionForm";

const productSchema = z.object({
  name: z.string().trim().min(1).max(120), subtitle: z.string().trim().max(3000),
  businessImpact: z.string().trim().max(3000), releasePlan: z.string().trim().max(120),
  owner: z.string().trim().max(120).optional(),
  status: z.enum(["planning", "developing", "evaluating", "delivered", "launched"]).optional(),
  version: z.string(),
});

export async function saveProduct(id: string, _previous: FormResult, form: FormData): Promise<FormResult> {
  const parsed = productSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "请填写产品名称，并检查资料字数与产品状态。" };
  const { owner, status, version, ...fields } = parsed.data;
  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.aiProject.findUnique({ where: { id } });
    if (!product || product.updatedAt.toISOString() !== version) return { error: "产品资料已更新，请刷新后再保存。" };
    const data = product.requestId ? fields : { ...fields, owner, status };
    if (Object.entries(data).every(([k,v]) => v === undefined || v === product[k as keyof typeof product])) return { success: "产品资料已是最新。" };
    const changed = await tx.aiProject.updateMany({ where: { id, updatedAt: product.updatedAt }, data });
    if (!changed.count) return { error: "产品资料已更新，请刷新后再保存。" };
    await tx.aiProjectProgress.create({ data: { projectId: id, content: "更新产品资料" } });
    return { success: "产品资料已保存。" };
  });
  revalidatePath("/ai-projects");
  revalidatePath("/ai-projects/products/" + id);
  return result;
}

export async function addProgress(type: "request" | "product", id: string, _previous: FormResult, form: FormData): Promise<FormResult> {
  const parsed = z.object({ actor: z.string().trim().min(1).max(80), content: z.string().trim().min(1).max(2000) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "请填写更新人和进展，内容限 2,000 字。" };
  const { actor, content } = parsed.data;
  const result = await prisma.$transaction(async (tx) => {
    if (type === "product") {
      const product = await tx.aiProject.findUnique({ where: { id }, select: { requestId: true } });
      if (!product) return { error: "找不到该产品。" };
      if (!product.requestId) {
        await tx.aiProjectProgress.create({ data: { projectId: id, content: actor + " · " + content } });
        return { success: "进展已记录。" };
      }
      id = product.requestId;
    }
    const request = await tx.aiDemandRequest.findUnique({ where: { id }, select: { id: true } });
    if (!request) return { error: "找不到该需求。" };
    await tx.aiWorkflowLog.create({ data: { requestId: id, action: progressLogAction, actor, detail: content } });
    return { success: "进展已记录。" };
  });
  revalidatePath("/ai-projects");
  revalidatePath("/ai-projects/weekly");
  revalidatePath("/ai-requests/[id]", "page");
  revalidatePath("/ai-projects/products/[id]", "page");
  return result;
}
