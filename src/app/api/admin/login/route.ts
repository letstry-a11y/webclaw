import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json({ error: "请使用管理员的企业账号在登录页登录" }, { status: 401 });
}
