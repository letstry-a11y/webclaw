import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

/** @param {string} value */
export function normalizeCompanyEmail(value) {
  return value.trim().toLowerCase();
}

/** @param {string} email */
export function isAllowedCompanyEmail(email) {
  const domains = (process.env.COMPANY_EMAIL_DOMAINS || "microport.com").toLowerCase().split(",").map(domain => domain.trim());
  const parts = normalizeCompanyEmail(email).split("@");
  return parts.length === 2 && Boolean(parts[0] && parts[1]) && domains.includes(parts[1]);
}

/** @param {string} password */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** @param {string} password @param {string | null} encoded */
export async function verifyPassword(password, encoded) {
  if (!encoded || !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(encoded)) return false;
  const [, salt, hash] = encoded.split(":");
  const actual = await scrypt(password, Buffer.from(salt, "hex"), 64);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}

export function createActivation() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: createHash("sha256").update(token).digest("hex") };
}

/** @param {string | undefined} token @param {string} hash */
export function validActivation(token, hash) {
  if (!token || token.length !== 43 || !/^[a-f0-9]{64}$/.test(hash)) return false;
  return timingSafeEqual(createHash("sha256").update(token).digest(), Buffer.from(hash, "hex"));
}
