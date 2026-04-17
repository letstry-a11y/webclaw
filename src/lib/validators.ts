import { z } from "zod";

const coverImageSchema = z
  .string()
  .max(2000)
  .refine(
    (v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v),
    "封面图片必须是 URL 或上传路径"
  )
  .optional()
  .or(z.literal(""));

export const attachmentSchema = z.object({
  url: z.string().min(1),
  name: z.string().min(1).max(200),
  size: z.number().int().nonnegative(),
  type: z.string().max(100).default("application/octet-stream"),
});

export type Attachment = z.infer<typeof attachmentSchema>;

export const createPostSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题不能超过200字"),
  content: z.string().min(1, "内容不能为空"),
  excerpt: z.string().optional(),
  coverImage: coverImageSchema,
  category: z.string().default("general"),
  tags: z.string().default(""),
  authorName: z.string().max(50).default("匿名用户"),
  type: z.enum(["blog", "activity"]).default("blog"),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  eventLink: z.string().optional(),
  attachments: z.array(attachmentSchema).max(20).default([]),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "评论不能为空").max(2000, "评论不能超过2000字"),
  authorName: z.string().max(50).default("匿名用户"),
  postId: z.string(),
  parentId: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
