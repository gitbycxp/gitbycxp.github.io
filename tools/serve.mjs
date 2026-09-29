/* 极简静态服务器，用来本地预览：node tools/serve.mjs [端口] */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2]) || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    const target = normalize(join(ROOT, url === "/" ? "index.html" : url));
    if (!target.startsWith(ROOT)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    const info = await stat(target);
    const file = info.isDirectory() ? join(target, "index.html") : target;
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-cache"
    });
    res.end(body);
  } catch (err) {
    try {
      const body = await readFile(join(ROOT, "404.html"));
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(body);
    } catch (err2) {
      res.writeHead(404).end("not found");
    }
  }
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT}/  （Ctrl+C 停止）`);
});
