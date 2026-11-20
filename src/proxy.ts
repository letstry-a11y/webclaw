import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { hasLocalReportToken, isDirectLocalRequest } from "@/lib/management-report-access";

const accountPages = new Set(["/login", "/register", "/forgot-password"]);
const accountPosts = new Set(["/api/auth/register", "/api/auth/login", "/api/auth/logout"]);
const privateHeaders = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" };
function allow() {
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(privateHeaders)) response.headers.set(key, value);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const read = request.method === "GET" || request.method === "HEAD";
  const origin = request.headers.get("origin");
  if (!read && origin && !["https://" + request.headers.get("host"), "http://" + request.headers.get("host")].includes(origin)) {
    return NextResponse.json({ error: "请求来源无效" }, { status: 403, headers: privateHeaders });
  }
  if (read && (accountPages.has(pathname) || pathname === "/brand/medbot-logo-white.png" || pathname === "/favicon.ico")) return allow();
  if (request.method === "POST" && accountPosts.has(pathname)) return allow();
  if (read && pathname === "/api/management/ai-projects" && hasLocalReportToken(request)) return allow();

  const user = await userFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    if (!read || pathname.startsWith("/api/")) return NextResponse.json({ error: "请先登录企业账号" }, { status: 401, headers: privateHeaders });
    const host = request.headers.get("host") || "";
    const local = isDirectLocalRequest(request);
    const origin = local ? request.nextUrl.protocol + "//" + host : process.env.PUBLIC_BASE_URL || request.nextUrl.origin;
    const login = new URL("/login", origin);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login, { status: 307, headers: privateHeaders });
  }
  if ((pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")) && user.role !== "admin") {
    return new NextResponse("此页面仅限管理员访问", { status: 403, headers: privateHeaders });
  }
  return allow();
}

export const config = { matcher: ["/((?!_next/static/).*)"] };
