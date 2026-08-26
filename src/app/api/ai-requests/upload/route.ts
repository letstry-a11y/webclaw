import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".txt", ".csv", ".zip", ".png", ".jpg", ".jpeg", ".webp",
]);
const uploadWindows = new Map<string, { count: number; resetAt: number }>();

function getIp(request: NextRequest) {
  const forwarded = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]
    || request.headers.get("x-real-ip")
    || "unknown";
  return forwarded.trim().slice(0, 80);
}

function withinUploadLimit(ip: string) {
  const now = Date.now();
  const window = uploadWindows.get(ip);
  if (!window || window.resetAt <= now) {
    uploadWindows.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (window.count >= 20) return false;
  window.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  if (!withinUploadLimit(ip)) {
    return NextResponse.json({ error: "上传过于频繁，请稍后再试" }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "无效的上传数据" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少文件" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "单个附件大小必须在 10MB 以内" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "不支持该附件格式" }, { status: 400 });
  }

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const relativeDir = path.join("uploads", "ai-requests", year, month);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const filename = `${randomBytes(16).toString("hex")}${ext}`;
  const absolutePath = path.join(absoluteDir, filename);
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()), { mode: 0o644 });

  return NextResponse.json({
    url: `/${path.posix.join(...relativeDir.split(path.sep), filename)}`,
    name: file.name.slice(0, 200),
    size: file.size,
    type: file.type || "application/octet-stream",
  });
}
