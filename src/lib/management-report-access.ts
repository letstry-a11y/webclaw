import { createHash, timingSafeEqual } from "node:crypto";

export function isDirectLocalRequest(request: Request) {
  // Compose binds the origin to loopback. Inside Docker the peer address is the bridge gateway.
  return !request.headers.has("cf-ray") &&
    /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(request.headers.get("host") || "");
}

export function hasLocalReportToken(request: Request) {
  if (!isDirectLocalRequest(request)) return false;
  const expected = process.env.MANAGEMENT_REPORT_TOKEN;
  const value = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  if (!expected || !value) return false;
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(value), digest(expected));
}
