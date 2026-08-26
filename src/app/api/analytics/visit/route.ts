import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const visitSchema = z.object({
  event: z.enum(["start", "heartbeat", "end"]),
  visitId: z.string().uuid(),
  sessionId: z.string().uuid(),
  path: z.string().trim().min(1).max(1000).refine((value) => value.startsWith("/")),
  pageTitle: z.string().trim().max(300).default(""),
  referrer: z.string().trim().max(2000).default(""),
  durationSeconds: z.coerce.number().int().min(0).max(86_400).default(0),
});

function getIpAddress(request: NextRequest) {
  const value = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]
    || request.headers.get("x-real-ip")
    || "unknown";
  return value.trim().replace(/^::ffff:/, "").slice(0, 80);
}

export async function POST(request: NextRequest) {
  const parsed = visitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "无效的访问记录" }, { status: 400 });
  }

  const data = parsed.data;
  const now = new Date();
  if (data.event === "start") {
    await prisma.visitRecord.upsert({
      where: { id: data.visitId },
      create: {
        id: data.visitId,
        sessionId: data.sessionId,
        ipAddress: getIpAddress(request),
        path: data.path,
        pageTitle: data.pageTitle,
        referrer: data.referrer,
        userAgent: request.headers.get("user-agent")?.slice(0, 1000) || "",
        durationSeconds: data.durationSeconds,
        lastSeenAt: now,
      },
      update: {
        pageTitle: data.pageTitle,
        lastSeenAt: now,
      },
    });
  } else {
    const existing = await prisma.visitRecord.findUnique({ where: { id: data.visitId } });
    await prisma.visitRecord.upsert({
      where: { id: data.visitId },
      create: {
        id: data.visitId,
        sessionId: data.sessionId,
        ipAddress: getIpAddress(request),
        path: data.path,
        pageTitle: data.pageTitle,
        referrer: data.referrer,
        userAgent: request.headers.get("user-agent")?.slice(0, 1000) || "",
        durationSeconds: data.durationSeconds,
        lastSeenAt: now,
      },
      update: {
        pageTitle: data.pageTitle,
        durationSeconds: Math.max(existing?.durationSeconds || 0, data.durationSeconds),
        lastSeenAt: now,
      },
    });
  }

  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
