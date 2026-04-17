import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
]);

const BLOCKED_EXTS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi",
  ".com", ".scr", ".app", ".jar", ".php", ".asp",
]);

function extFromName(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "无效的上传数据" }, { status: 400 });
  }

  const file = formData.get("file");
  const kind = (formData.get("kind") as string) || "file";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少文件" }, { status: 400 });
  }

  const isImage = IMAGE_TYPES.has(file.type);
  if (kind === "image" && !isImage) {
    return NextResponse.json({ error: "仅支持图片格式" }, { status: 400 });
  }

  const limit = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
  if (file.size > limit) {
    const mb = (limit / 1024 / 1024).toFixed(0);
    return NextResponse.json({ error: `文件过大，上限 ${mb}MB` }, { status: 400 });
  }

  const ext = extFromName(file.name);
  if (BLOCKED_EXTS.has(ext)) {
    return NextResponse.json({ error: "该文件类型不允许上传" }, { status: 400 });
  }

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const subdir = path.join("uploads", year, month);
  const absDir = path.join(process.cwd(), "public", subdir);
  await mkdir(absDir, { recursive: true });

  const safeExt = ext.replace(/[^a-z0-9.]/g, "") || ".bin";
  const id = randomBytes(12).toString("hex");
  const filename = `${id}${safeExt}`;
  const absPath = path.join(absDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buffer);

  const url = `/${path.posix.join(subdir.split(path.sep).join("/"), filename)}`;

  return NextResponse.json({
    url,
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
  });
}
