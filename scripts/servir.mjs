// Servidor local de prévia de dist/, com URLs limpas como na Vercel.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const PORT = Number(process.env.PORT || 4321);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp", ".svg": "image/svg+xml", ".pdf": "application/pdf" };

async function resolve(path) {
  for (const c of [path, `${path}.html`, join(path, "index.html")]) {
    try { if ((await stat(join(DIST, c))).isFile()) return c; } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/\.\.+/g, "");
  const file = await resolve(path);
  const target = file ?? "404.html";
  res.writeHead(file ? 200 : 404, { "Content-Type": TYPES[extname(target)] || "application/octet-stream" });
  res.end(await readFile(join(DIST, target)));
}).listen(PORT, () => console.log(`Prévia em http://localhost:${PORT}`));
