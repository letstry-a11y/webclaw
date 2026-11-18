import { NextResponse } from "next/server";
import { checkPassword, signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = body?.password;
  if (typeof password !== "string") return NextResponse.json({ error: "请输入管理密码" }, { status: 400 });

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const token = await signToken();
  const cookieStore = await cookies();
  cookieStore.set("admin_token", token, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return NextResponse.json({ success: true });
}
