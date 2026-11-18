import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function signingSecret() {
  const value = process.env.JWT_SECRET;
  return value && value !== "change-me-in-production" ? new TextEncoder().encode(value) : null;
}

export async function signToken(): Promise<string> {
  const secret = signingSecret();
  if (!secret) throw new Error("管理登录尚未配置");
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<boolean> {
  const secret = signingSecret();
  if (!secret) return false;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  return verifyToken(token);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected && expected !== "change-me" && signingSecret()) && password === expected;
}
