import assert from "node:assert/strict";
import test from "node:test";
import { aiProjectApplicationSchema } from "./ai-project-application";

const validApplication = {
  name: "测试员工",
  department: "测试部门",
  email: "TESTER@microport.com",
  intendedRole: "项目成员",
  skills: "无",
  weeklyAvailability: "每周 2 小时",
  statement: "",
};

test("accepts a one-character skills description", () => {
  const result = aiProjectApplicationSchema.parse(validApplication);
  assert.equal(result.skills, "无");
  assert.equal(result.email, "tester@microport.com");
});

test("still rejects an empty skills description", () => {
  assert.equal(aiProjectApplicationSchema.safeParse({ ...validApplication, skills: "  " }).success, false);
});
