import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(ADMIN_COOKIE);
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
