import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "./random-uuid";

const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test("returns a UUID v4 with the browser API", () => {
  assert.match(randomUUID(), uuidV4Pattern);
});

test("returns a UUID v4 when crypto.randomUUID is unavailable", () => {
  const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: undefined });
  try {
    assert.match(randomUUID(), uuidV4Pattern);
  } finally {
    if (cryptoDescriptor) Object.defineProperty(globalThis, "crypto", cryptoDescriptor);
  }
});
