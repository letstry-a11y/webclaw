import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { GET, HEAD } from "../app/api/files/[...path]/route";

test("new and historical uploads are served immediately, including HEAD requests", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "medbot-uploads-"));
  t.mock.method(process, "cwd", () => directory);
  try {
    for (const segments of [["ai-requests", "2026", "01", "sample.txt"], ["2026", "01", "legacy.png"]]) {
      const file = path.join(directory, "public", "uploads", ...segments);
      const context = { params: Promise.resolve({ path:segments }) };
      const request = new Request("https://example.invalid/uploads/" + segments.join("/"));
      assert.equal((await GET(request, context)).status,404);
      await mkdir(path.dirname(file), { recursive:true });
      await writeFile(file, Buffer.from("fixture"));
      const result = await GET(request, context);
      assert.equal(result.status,200);
      assert.equal(await result.text(),"fixture");
      assert.equal(result.headers.get("Content-Disposition"), file.endsWith(".png") ? "inline" : "attachment");
      const head = await HEAD(new Request(request.url, { method:"HEAD" }), context);
      assert.equal(head.headers.get("Content-Length"),"7");
      assert.equal(head.body,null);
    }
  } finally { await rm(directory, { recursive:true, force:true }); }
});
