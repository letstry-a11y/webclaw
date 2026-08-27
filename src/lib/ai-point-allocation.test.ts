import assert from "node:assert/strict";
import test from "node:test";
import { calculatePointAllocations, inferRatioTenths } from "./ai-point-allocation";

test("calculates a complete point pool and 70/30 release", () => {
  const result = calculatePointAllocations(1001, [
    { key: "lead", ratioTenths: 667 },
    { key: "member", ratioTenths: 333 },
  ]);
  assert.equal(result.reduce((sum, item) => sum + item.proposedPoints, 0), 1001);
  assert.equal(result.reduce((sum, item) => sum + item.issuedPoints, 0), 701);
  assert.equal(result.reduce((sum, item) => sum + item.warrantyPoints, 0), 300);
});

test("rejects ratios that do not total 100 percent", () => {
  assert.throws(
    () => calculatePointAllocations(1000, [{ key: "lead", ratioTenths: 999 }]),
    /必须等于 100%/,
  );
});

test("uses stored ratios when available", () => {
  assert.deepEqual(inferRatioTenths(1000, [
    { key: "a", proposedPoints: 333, ratioTenths: 333 },
    { key: "b", proposedPoints: 667, ratioTenths: 667 },
  ]), { a: 333, b: 667 });
});

test("reconstructs legacy allocation ratios to exactly 100 percent", () => {
  const inferred = inferRatioTenths(1001, [
    { key: "a", proposedPoints: 334 },
    { key: "b", proposedPoints: 333 },
    { key: "c", proposedPoints: 334 },
  ]);
  assert.equal(Object.values(inferred).reduce((sum, ratio) => sum + ratio, 0), 1000);
  assert.ok(Object.values(inferred).every((ratio) => ratio > 0));
});
