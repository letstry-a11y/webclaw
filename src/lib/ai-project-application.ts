import { z } from "zod";

const applicationEmailSchema = z.string().trim().email().max(120).transform((value) => value.toLowerCase());

export const aiProjectApplicationSchema = z.object({
  name: z.string().trim().min(1).max(50),
  department: z.string().trim().min(1).max(80),
  email: applicationEmailSchema,
  intendedRole: z.string().trim().min(1).max(100),
  skills: z.string().trim().min(1, "请填写相关技能与项目经验；暂无可填写“暂无”").max(2000),
  weeklyAvailability: z.string().trim().min(1).max(200),
  statement: z.string().trim().max(2000),
});
