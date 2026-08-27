import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/admin/login", "/api/auth/", "/api/admin/login", "/api/health"];
function isPublic(pathname: string) { return PUBLIC_PATHS.some((path) => pathname === path || (path.endsWith("/") && pathname.startsWith(path))); }
async function tokenPayload(token?: string) {
  if (!token) return null;
  try { return (await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "local-development-only-secret"))).payload; } catch { return null; }
}
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();
  const userPayload = await tokenPayload(request.cookies.get("medbot_session")?.value);
  const adminPayload = await tokenPayload(request.cookies.get("admin_token")?.value);
  const activeUser = userPayload?.type === "user" && userPayload.sub
    ? await prisma.user.findUnique({ where: { id: userPayload.sub }, select: { isActive: true, sessionVersion: true, role: true } })
    : null;
  const userIsValid = Boolean(activeUser?.isActive && activeUser.sessionVersion === userPayload?.version);
  if (userIsValid || adminPayload?.type === "breakglass-admin") {
    if (pathname.startsWith("/admin") && pathname !== "/admin/login" && activeUser?.role !== "admin" && adminPayload?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (["/login", "/register", "/forgot-password"].includes(pathname)) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const login = new URL("/login", request.url); login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:woff|woff2)$).*)"] };
