import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
const TYPES: Record<string, string> = {
  ".pdf": "application/pdf", ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain; charset=utf-8", ".csv": "text/csv; charset=utf-8", ".zip": "application/zip",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const user = await requireUser();
  const { filename } = await params;
  const year = request.nextUrl.searchParams.get("year") || "";
  const month = request.nextUrl.searchParams.get("month") || "";
  if (!/^[a-f0-9]{32}\.[a-z0-9]+$/.test(filename) || !/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) {
    return NextResponse.json({ error: "附件地址无效" }, { status: 400 });
  }
  const filePath = path.join(process.cwd(), "data", "private-uploads", "ai-requests", year, month, filename);
  try {
    const content = await readFile(filePath);
    const displayName = (request.nextUrl.searchParams.get("name") || filename).replace(/[\r\n"]/g, "").slice(0, 200);
    await writeAuditLog(user, "下载AI需求附件", { targetType: "Attachment", targetId: filename, detail: displayName });
    return new NextResponse(content, { headers: {
      "Content-Type": TYPES[path.extname(filename)] || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(displayName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return NextResponse.json({ error: "附件不存在" }, { status: 404 });
  }
}
