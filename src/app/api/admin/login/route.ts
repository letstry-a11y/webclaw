import { NextResponse } from "next/server";
import { checkPassword, signToken } from "@/lib/auth";
import { cookies } from "next/headers";

const attempts = new Map<string, { count: number; resetAt: number }>();

function canAttempt(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) { attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 }); return true; }
  if (current.count >= 5) return false;
  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  const ip = (request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim().slice(0, 80);
  if (!canAttempt(ip)) return NextResponse.json({ error: "登录尝试过多，请稍后再试" }, { status: 429 });
  const { password } = await request.json();

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const token = await signToken();
  attempts.delete(ip);
  const cookieStore = await cookies();
  cookieStore.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return NextResponse.json({ success: true });
}
