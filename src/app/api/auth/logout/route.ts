import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEVICE_COOKIE, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(DEVICE_COOKIE);
  return new NextResponse(null, { status: 303, headers: { Location: "/login", "Cache-Control": "private, no-store" } });
}
