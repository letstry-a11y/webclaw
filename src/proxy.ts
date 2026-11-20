import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";

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
  // The existing reporting job runs on loopback. Its route independently checks the read-only bearer token.
  if (read && pathname === "/api/management/ai-projects" && !request.headers.has("cf-ray") &&
      (request.headers.get("x-forwarded-for") || "127.0.0.1").split(",").every(ip => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ip.trim())) &&
      /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(request.headers.get("host") || "") &&
      request.headers.has("authorization")) return allow();

  const user = await userFromSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    if (!read || pathname.startsWith("/api/")) return NextResponse.json({ error: "请先登录企业账号" }, { status: 401, headers: privateHeaders });
    const host = request.headers.get("host") || "";
    const local = !request.headers.has("cf-ray") && /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host);
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
