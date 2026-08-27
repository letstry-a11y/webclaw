import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "medbot_session";
export const ADMIN_COOKIE = "admin_token";
export const USER_ROLES = ["employee", "committee", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  sessionVersion: number;
};

function jwtSecret() {
  const value = process.env.JWT_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is required in production");
  return new TextEncoder().encode(value || "local-development-only-secret");
}

export function normalizeCompanyEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isAllowedCompanyEmail(email: string) {
  const domains = (process.env.COMPANY_EMAIL_DOMAINS || "microport.com")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const domain = normalizeCompanyEmail(email).split("@")[1];
  return Boolean(domain && domains.includes(domain));
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, saltHex, hashHex] = stored.split(":");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashVerificationCode(email: string, purpose: string, code: string) {
  return createHash("sha256")
    .update(`${normalizeCompanyEmail(email)}:${purpose}:${code}:${process.env.JWT_SECRET || "local"}`)
    .digest("hex");
}

export async function signUserToken(user: AuthUser) {
  return new SignJWT({
    type: "user", name: user.name, email: user.email, department: user.department,
    role: user.role, version: user.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtSecret());
}

export async function signToken(): Promise<string> {
  return new SignJWT({ type: "breakglass-admin", role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(jwtSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function verifyToken(token: string): Promise<boolean> {
  return Boolean(await verifySessionToken(token));
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (payload?.type !== "user" || !payload.sub) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive || user.sessionVersion !== payload.version) return null;
  const role = USER_ROLES.includes(user.role as UserRole) ? user.role as UserRole : "employee";
  return { id: user.id, name: user.name, email: user.email, department: user.department, role, sessionVersion: user.sessionVersion };
}

export async function requireUser(roles?: readonly UserRole[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("请先登录");
  if (roles && !roles.includes(user.role)) throw new Error("没有执行该操作的权限");
  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (user?.role === "admin") return true;
  const legacyToken = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!legacyToken) return false;
  const payload = await verifySessionToken(legacyToken);
  return payload?.type === "breakglass-admin" && payload.role === "admin";
}

export function checkPassword(password: string): boolean {
  const configured = process.env.ADMIN_PASSWORD;
  return Boolean(configured && password === configured);
}
