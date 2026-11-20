import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { isAllowedCompanyEmail } from "../../scripts/company-credentials.mjs";
export { hashPassword, verifyPassword, isAllowedCompanyEmail, normalizeCompanyEmail } from "../../scripts/company-credentials.mjs";

export const SESSION_COOKIE = "medbot_session";
export const DEVICE_COOKIE = "medbot_device";
export type AuthUser = { id: string; name: string; email: string; department: string; role: string; sessionVersion: number };
type SessionIdentity = Pick<AuthUser, "id" | "sessionVersion">;

function jwtSecret() {
  const key = process.env.JWT_SECRET;
  if (!key || key === "change-me-in-production") throw new Error("请先配置 JWT_SECRET");
  return new TextEncoder().encode(key);
}

export function signUserToken(user: AuthUser) {
  return new SignJWT({ type: "user", role: user.role, version: user.sessionVersion })
    .setSubject(user.id).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(jwtSecret());
}

export async function verifySessionToken(token: string) {
  try { return (await jwtVerify(token, jwtSecret(), { algorithms: ["HS256"] })).payload; }
  catch { return null; }
}

export async function userFromSession(token?: string): Promise<AuthUser | null> {
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload?.sub || payload.type !== "user") return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub },
    select: { id: true, name: true, email: true, department: true, role: true, sessionVersion: true, status: true } });
  if (!user || user.status !== "approved" || user.sessionVersion !== payload.version || !isAllowedCompanyEmail(user.email)) return null;
  return user;
}

export async function getCurrentUser() {
  return userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("请先登录已获批的企业账号");
  return user;
}

export async function isAdmin() {
  return (await getCurrentUser())?.role === "admin";
}

const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

export async function setSessionCookie(user: AuthUser) {
  (await cookies()).set(SESSION_COOKIE, await signUserToken(user), { ...cookieOptions, maxAge: 7 * 86400 });
}

export async function rememberDevice(user: SessionIdentity) {
  const token = await new SignJWT({ type: "initial-device", version: user.sessionVersion })
    .setSubject(user.id).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("365d").sign(jwtSecret());
  (await cookies()).set(DEVICE_COOKIE, token, { ...cookieOptions, maxAge: 365 * 86400 });
}

export async function trustedDevice(user: SessionIdentity) {
  const cookie = (await cookies()).get(DEVICE_COOKIE)?.value;
  const payload = cookie ? await verifySessionToken(cookie) : null;
  return payload?.type === "initial-device" && payload.sub === user.id && payload.version === user.sessionVersion;
}
