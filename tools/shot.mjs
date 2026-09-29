/* =========================================================================
   Pixel Morandi · 截图预览
   -------------------------------------------------------------------------
   用无头 Chrome 把页面整页截图，方便一眼看到效果。

   用法：
     node tools/shot.mjs --out=./.preview           本地预览
     node tools/shot.mjs --base=https://xxx --out=./.preview
   ========================================================================= */

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8793;

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const OUT_DIR = resolve(ROOT, arg("out", ".preview"));
const REMOTE = arg("base", null);
const BASE = REMOTE ? REMOTE.replace(/\/$/, "") + "/" : `http://127.0.0.1:${PORT}/`;

const SHOTS = [
  { file: "index.html", name: "01-首页-浅色", width: 1440, height: 900, theme: "light" },
  { file: "index.html", name: "02-首页-暮色", width: 1440, height: 900, theme: "dusk" },
  { file: "projects.html", name: "03-作品", width: 1440, height: 900, theme: "light" },
  { file: "about.html", name: "04-关于", width: 1440, height: 900, theme: "light" },
  { file: "contact.html", name: "05-联系", width: 1440, height: 900, theme: "dusk" },
  { file: "index.html", name: "06-手机端", width: 390, height: 844, theme: "light" }
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    const target = normalize(join(ROOT, url === "/" ? "index.html" : url));
    const body = await readFile(target);
    await stat(target);
    res.writeHead(200, {
      "content-type": MIME[extname(target).toLowerCase()] || "application/octet-stream"
    });
    res.end(body);
  } catch (err) {
    res.writeHead(404).end("not found");
  }
});

if (!REMOTE) await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome"
].find((p) => existsSync(p));

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT + 1}`,
    `--user-data-dir=${join(tmpdir(), "pixel-shot-" + Date.now())}`,
    "--no-first-run",
    "--disable-extensions",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "about:blank"
  ],
  { stdio: ["ignore", "ignore", "ignore"] }
);

let target = null;
for (let i = 0; i < 60 && !target; i++) {
  await sleep(250);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT + 1}/json/list`)).json();
    target = list.find((t) => t.type === "page");
  } catch (err) {
    /* 等它起来 */
  }
}
if (!target) throw new Error("Chrome 没起来");

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((done, reject) => {
  ws.addEventListener("open", done);
  ws.addEventListener("error", reject);
});

let seq = 0;
const waiting = new Map();
const eventHandlers = [];

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && waiting.has(msg.id)) {
    const { done, reject } = waiting.get(msg.id);
    waiting.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : done(msg.result);
  } else if (msg.method) {
    eventHandlers.forEach((fn) => fn(msg));
  }
});

function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((done, reject) => waiting.set(id, { done, reject }));
}

function waitFor(method, timeout = 60000) {
  return new Promise((done, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout " + method)), timeout);
    const fn = (msg) => {
      if (msg.method !== method) return;
      clearTimeout(timer);
      eventHandlers.splice(eventHandlers.indexOf(fn), 1);
      done(msg.params);
    };
    eventHandlers.push(fn);
  });
}

await send("Page.enable");
await send("Runtime.enable");

async function evaluate(expression, awaitPromise = false) {
  const res = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  return res.result.value;
}

await mkdir(OUT_DIR, { recursive: true });

for (const shot of SHOTS) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: shot.width,
    height: shot.height,
    deviceScaleFactor: 1,
    mobile: shot.width < 600
  });

  const loaded = waitFor("Page.loadEventFired");
  await send("Page.navigate", { url: BASE + shot.file });
  await loaded;
  await sleep(700);

  await evaluate(`(function(){try{localStorage.setItem('pixel-morandi', JSON.stringify({theme:'${shot.theme}'}));}catch(e){}
    document.documentElement.setAttribute('data-theme','${shot.theme}');return 1;})()`);

  // 滚动一遍，把所有滚动出现的元素都唤起来
  await evaluate(
    `(async function () {
      var total = document.body.scrollHeight;
      for (var y = 0; y < total; y += Math.round(window.innerHeight * 0.8)) {
        window.scrollTo(0, y);
        await new Promise(function (r) { setTimeout(r, 90); });
      }
      window.scrollTo(0, 0);
      await new Promise(function (r) { setTimeout(r, 700); });
      return document.body.scrollHeight;
    })()`,
    true
  );

  const height = Math.min(await evaluate("document.body.scrollHeight"), 16000);
  const result = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: shot.width, height, scale: 1 }
  });

  const file = join(OUT_DIR, `${shot.name}.png`);
  await writeFile(file, Buffer.from(result.data, "base64"));
  console.log(`${shot.name}.png  ${shot.width}×${height}`);
}

console.log(`\n输出目录：${OUT_DIR}`);

chrome.kill();
try {
  server.close();
} catch (err) {
  /* 远程模式没有服务器 */
}
process.exit(0);
