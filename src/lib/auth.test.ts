import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, isAllowedCompanyEmail, normalizeCompanyEmail, signUserToken, verifyPassword, verifySessionToken } from "./auth";

test("company email matching is normalized and restricted", () => {
  process.env.COMPANY_EMAIL_DOMAINS = "microport.com";
  assert.equal(normalizeCompanyEmail(" User@MicroPort.com "), "user@microport.com");
  assert.equal(isAllowedCompanyEmail("user@microport.com"), true);
  assert.equal(isAllowedCompanyEmail("user@example.com"), false);
  assert.equal(isAllowedCompanyEmail("user@microport.com.example.com"), false);
});

test("password hashes are salted and verify safely", async () => {
  const first = await hashPassword("Passw0rd!");
  const second = await hashPassword("Passw0rd!");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("Passw0rd!", first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
});

test("signed user sessions preserve identity and role", async () => {
  process.env.JWT_SECRET = "unit-test-secret";
  const token = await signUserToken({ id: "user-1", name: "测试用户", email: "user@microport.com", department: "测试部", role: "employee", sessionVersion: 2 });
  const payload = await verifySessionToken(token);
  assert.equal(payload?.sub, "user-1");
  assert.equal(payload?.role, "employee");
  assert.equal(payload?.version, 2);
});
