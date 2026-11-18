"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportingWeek } from "@/lib/report-week";
import { z } from "zod";

const fields = z.object({
  achievement: z.string().trim().min(1).max(2000),
  nextStep: z.string().trim().min(1).max(2000),
  blocker: z.string().trim().max(1000),
  author: z.string().trim().min(1).max(80),
  version: z.string().max(40),
});
export type NoteResult = { error?: string; saved?: boolean };

export async function saveWeeklyUpdate(key: string, start: string, _previous: NoteResult, form: FormData): Promise<NoteResult> {
  if (!await isAdmin()) return { error: "管理登录已过期，请重新登录。" };
  const week = reportingWeek(start);
  if (!week || week.start !== start || start > reportingWeek()!.start) return { error: "请选择本周或过去的周次。" };
  const match = /^(request|product):([\w-]+)$/.exec(key);
  const parsed = fields.safeParse(Object.fromEntries(form));
  if (!match || !parsed.success) return { error: "请填写本周成果、下周计划和填报人，并检查字数。" };
  const { version, ...data } = parsed.data;
  const conflict = { error: "这份周报已被其他人修改，请刷新页面并核对内容后保存。" };
  try {
    const result = await prisma.$transaction(async (tx) => {
      const [, type, id] = match;
      const record = type === "request"
        ? await tx.aiDemandRequest.findUnique({ where: { id }, select: { id: true, createdAt: true, project: { select: { id: true, createdAt: true } } } })
        : null;
      const product = type === "product"
        ? await tx.aiProject.findFirst({ where: { id, requestId: null }, select: { id: true, createdAt: true } })
        : null;
      const created = record?.project && record.project.createdAt < record.createdAt ? record.project.createdAt : record?.createdAt ?? product?.createdAt;
      if (!created || created.toISOString() >= week.until) return { error: "所选周次没有这个项目，请重新选择。" };
      const projectId = product?.id ?? record?.project?.id;
      const candidates = [...(record ? [{ requestId: record.id }] : []), ...(projectId ? [{ projectId }] : [])];
      const existing = await tx.aiWeeklyUpdate.findFirst({
        where: { weekStart: start, OR: candidates }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      });
      if ((existing?.updatedAt.toISOString() ?? "") !== version) return conflict;
      if (existing) {
        const changed = await tx.aiWeeklyUpdate.updateMany({ where: { id: existing.id, updatedAt: existing.updatedAt }, data });
        if (!changed.count) return conflict;
      } else {
        await tx.aiWeeklyUpdate.create({ data: { ...data, weekStart: start, ...(record ? { requestId: record.id } : { projectId: product!.id }) } });
      }
      return { saved: true };
    });
    if ("saved" in result) revalidatePath("/ai-projects/weekly");
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) return conflict;
    return { error: "暂时无法保存，请稍后重试。" };
  }
}
