import { open, realpath } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type FileContext = { params: Promise<{ path: string[] }> };
const images: Record<string,string> = {
  ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".gif":"image/gif",
  ".webp":"image/webp", ".avif":"image/avif", ".svg":"image/svg+xml",
};

async function serveFile(request: Request, context: FileContext) {
  const parts = (await context.params).path;
  if (!parts?.length || parts.some((part) => !part || part.startsWith(".") || part.includes("/") || part.includes("\\") || [...part].some((char) => char.charCodeAt(0) < 32))) {
    return new Response(null, { status:404 });
  }
  const root = path.join(process.cwd(), "public", "uploads");
  try {
    const [base,file] = await Promise.all([realpath(root), realpath(path.join(root, ...parts))]);
    const relative = path.relative(base, file);
    if (!relative || relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) return new Response(null, { status:404 });
    const handle = await open(file, "r");
    try {
      const stat = await handle.stat();
      if (!stat.isFile()) { await handle.close(); return new Response(null, { status:404 }); }
      const image = images[path.extname(file).toLowerCase()];
      const headers = {
        "Content-Type": image || "application/octet-stream",
        "Content-Disposition": image ? "inline" : "attachment",
        "Content-Length": String(stat.size),
        "X-Content-Type-Options":"nosniff", "Content-Security-Policy":"default-src 'none'; sandbox",
        "Cache-Control":"private, no-store",
      };
      if (request.method === "HEAD") { await handle.close(); return new Response(null, { headers }); }
      const body = Readable.toWeb(handle.createReadStream()) as ReadableStream<Uint8Array>;
      return new Response(body, { headers });
    } catch (error) {
      await handle.close();
      throw error;
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR" || code === "EACCES") return new Response(null, { status:404 });
    throw error;
  }
}

export { serveFile as GET, serveFile as HEAD };
