/* =========================================================================
   Pixel Morandi · 本地自检
   -------------------------------------------------------------------------
   起一个临时静态服务器，用无头 Chrome 打开每个页面，检查：
     · 有没有 JS 报错、控制台错误
     · 数据有没有渲染出来（导航 / 作品 / 技能 / 页脚……）
     · 字体有没有加载、图片有没有解码成功
     · 有没有横向溢出

   用法：node tools/check.mjs
   ========================================================================= */

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8791;
const PAGES = ["index.html", "projects.html", "about.html", "contact.html", "404.html"];

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium"
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------ 静态服务器 */

const server = createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    const target = normalize(join(ROOT, url === "/" ? "index.html" : url));
    if (!target.startsWith(ROOT)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    const info = await stat(target);
    if (info.isDirectory()) {
      res.writeHead(404).end("not found");
      return;
    }
    const body = await readFile(target);
    res.writeHead(200, {
      "content-type": MIME[extname(target).toLowerCase()] || "application/octet-stream",
      "content-length": body.length
    });
    res.end(body);
  } catch (err) {
    res.writeHead(404).end("not found");
  }
});

await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

/* ------------------------------------------------------------------ CDP */

class Client {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.listeners = [];
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: done, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : done(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
        this.listeners.forEach((fn) => fn(msg));
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((done, reject) => this.pending.set(id, { resolve: done, reject }));
  }

  on(fn) {
    this.listeners.push(fn);
  }

  waitFor(method, timeout = 15000) {
    return new Promise((done, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout: " + method)), timeout);
      const fn = (msg) => {
        if (msg.method !== method) return;
        clearTimeout(timer);
        this.listeners = this.listeners.filter((l) => l !== fn);
        done(msg.params);
      };
      this.on(fn);
    });
  }
}

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error("找不到 Chrome / Edge");
  return found;
}

async function connect() {
  const chrome = spawn(
    findChrome(),
    [
      "--headless=new",
      `--remote-debugging-port=${PORT + 1}`,
      `--user-data-dir=${join(tmpdir(), "pixel-morandi-chrome-" + Date.now())}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--hide-scrollbars",
      "--window-size=1440,900",
      "about:blank"
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );

  let target = null;
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT + 1}/json/list`);
      const list = await res.json();
      target = list.find((t) => t.type === "page");
      if (target) break;
    } catch (err) {
      /* 还没起来 */
    }
  }
  if (!target) {
    chrome.kill();
    throw new Error("Chrome 调试端口没起来");
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, reject) => {
    ws.addEventListener("open", done);
    ws.addEventListener("error", reject);
  });

  return { chrome, client: new Client(ws) };
}

/* ---------------------------------------------------------------- 检查 */

const PROBE = `(function () {
  var doc = document.documentElement;
  var wide = [];
  var all = document.querySelectorAll("body *");
  for (var i = 0; i < all.length; i++) {
    var node = all[i];
    var style = getComputedStyle(node);
    if (style.position === "fixed" || style.display === "none") continue;
    if (node.closest(".marquee")) continue; /* 走马灯本来就比屏幕宽 */
    var box = node.getBoundingClientRect();
    if (box.width > 0 && box.right > window.innerWidth + 1) {
      wide.push((node.className || node.tagName) + " → " + Math.round(box.right));
    }
    if (wide.length > 4) break;
  }
  var scene = document.querySelector(".scene--day");
  var mark = document.querySelector(".brand__mark img");
  return JSON.stringify({
    title: document.title,
    ready: document.readyState,
    nav: document.querySelectorAll(".site-nav__link").length,
    current: (document.querySelector(".site-nav__link[aria-current]") || {}).textContent || null,
    marquee: document.querySelectorAll(".marquee__item").length,
    stats: document.querySelectorAll(".stat").length,
    skills: document.querySelectorAll(".skill").length,
    cards: document.querySelectorAll(".card").length,
    filters: document.querySelectorAll(".filter-btn").length,
    miniCards: document.querySelectorAll(".mini-card").length,
    terminalLines: document.querySelectorAll(".term__line").length,
    channels: document.querySelectorAll(".contact-card").length,
    faq: document.querySelectorAll(".faq__item").length,
    footerLinks: document.querySelectorAll("[data-footer-links] a").length,
    portrait: !!document.querySelector("[data-portrait] img"),
    brandMark: mark ? { ok: mark.complete && mark.naturalWidth > 0, w: mark.naturalWidth } : null,
    scene: scene ? { ok: scene.complete && scene.naturalWidth > 0, w: scene.naturalWidth } : null,
    icons: document.querySelectorAll(".mini-card__icon svg, .contact-card__icon svg").length,
    fonts: {
      cjk: document.fonts.check("12px FusionPixel", "像素"),
      ui: document.fonts.check("12px PixelUI", "PX"),
      display: document.fonts.check("12px PixelDisplay", "PX"),
      loaded: document.fonts.size
    },
    barWidths: Array.prototype.slice.call(document.querySelectorAll(".bar__fill")).map(function (n) {
      return n.style.width || "0";
    }),
    overflowX: doc.scrollWidth - doc.clientWidth,
    wide: wide,
    theme: doc.getAttribute("data-theme"),
    nightSceneVisible: (function () {
      var n = document.querySelector(".scene--night");
      return n ? getComputedStyle(n).display !== "none" : null;
    })(),
    themeName: (document.querySelector("[data-theme-name]") || {}).textContent || null,
    visibleCards: (function () {
      var list = document.querySelectorAll(".card");
      var n = 0;
      for (var i = 0; i < list.length; i++) if (!list[i].hidden) n++;
      return n;
    })()
  });
})()`;

/* 每个页面跑完之后再做一次小交互测试 */
const ACTIONS = {
  "index.html": [
    {
      name: "切换暮色主题",
      run: `document.querySelector('.header-tools [data-theme-toggle]').click(); true`,
      check: `JSON.stringify({ theme: document.documentElement.getAttribute('data-theme'),
        night: getComputedStyle(document.querySelector('.scene--night')).display,
        day: getComputedStyle(document.querySelector('.scene--day')).display,
        label: (document.querySelector('[data-theme-name]')||{}).textContent })`
    },
    {
      name: "点“看看作品”的锚点（仅检查 href）",
      run: `document.querySelector('.hero__actions .btn').getAttribute('href')`,
      check: null
    }
  ],
  "projects.html": [
    {
      name: "筛选“工具”",
      run: `document.querySelector('[data-filter="工具"]').click(); true`,
      check: `JSON.stringify({ visible: Array.prototype.filter.call(document.querySelectorAll('.card'),
        function (c) { return !c.hidden; }).length,
        pressed: document.querySelector('[data-filter="工具"]').getAttribute('aria-pressed'),
        empty: document.querySelector('[data-projects-empty]').hidden })`
    }
  ],
  "contact.html": [
    {
      name: "展开第一条 FAQ",
      run: `document.querySelector('.faq__q').click(); true`,
      check: `JSON.stringify({ open: document.querySelector('.faq__item').className,
        expanded: document.querySelector('.faq__q').getAttribute('aria-expanded'),
        answerVisible: getComputedStyle(document.querySelector('.faq__a')).display })`
    }
  ]
};

const SCROLL_THROUGH = `(async function () {
  var total = document.body.scrollHeight;
  for (var y = 0; y < total; y += 400) {
    window.scrollTo(0, y);
    await new Promise(function (r) { setTimeout(r, 45); });
  }
  window.scrollTo(0, total);
  await new Promise(function (r) { setTimeout(r, 500); });
  return document.querySelectorAll('.bar__fill').length;
})()`;

const { chrome, client } = await connect();

await client.send("Page.enable");
await client.send("Runtime.enable");
await client.send("Log.enable");

const problems = [];
client.on((msg) => {
  if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    problems.push("JS 异常: " + (d.exception && d.exception.description ? d.exception.description : d.text));
  }
  if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
    problems.push(
      "控制台 " + msg.params.type + ": " +
        msg.params.args.map((a) => a.value || a.description || a.type).join(" ")
    );
  }
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
    problems.push("日志: " + msg.params.entry.text + " " + (msg.params.entry.url || ""));
  }
});

let failed = 0;

for (const page of PAGES) {
  problems.length = 0;
  const loaded = client.waitFor("Page.loadEventFired");
  await client.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/${page}` });
  await loaded;
  await sleep(900);

  // 先滚一遍，触发所有懒出现的元素
  await client.send("Runtime.evaluate", {
    expression: SCROLL_THROUGH,
    awaitPromise: true,
    returnByValue: true
  });
  await sleep(400);

  const result = await client.send("Runtime.evaluate", {
    expression: PROBE,
    returnByValue: true,
    awaitPromise: false
  });
  const data = JSON.parse(result.result.value);

  const highlights = [];
  if (data.nav === 0) highlights.push("导航没渲染");
  if (data.marquee && data.marquee < 18) highlights.push("走马灯数量偏少");
  if (data.skills && data.barWidths.some((w) => w === "0")) highlights.push("技能条没动：" + data.barWidths.join(" "));
  if (!data.fonts.cjk || !data.fonts.ui) highlights.push("字体没加载");
  if (data.overflowX > 1) highlights.push("横向溢出 " + data.overflowX + "px");
  if (data.wide.length) highlights.push("超出视口的元素: " + data.wide.join(" | "));
  if (data.scene && !data.scene.ok) highlights.push("风景图没加载");
  if (data.brandMark && !data.brandMark.ok) highlights.push("站标没加载");
  if (problems.length) highlights.push(...problems);

  if (highlights.length) failed++;

  console.log(`\n=== ${page} ${highlights.length ? "✗" : "✓"}`);
  console.log(
    `  导航 ${data.nav} / 当前 ${data.current} · 走马灯 ${data.marquee} · 数字 ${data.stats} · 技能 ${data.skills}` +
      ` · 卡片 ${data.cards} · 筛选 ${data.filters} · 小卡 ${data.miniCards} · 终端 ${data.terminalLines}`
  );
  console.log(
    `  联系卡 ${data.channels} · FAQ ${data.faq} · 页脚链接 ${data.footerLinks} · 头像 ${data.portrait}` +
      ` · 图标 ${data.icons} · 主题 ${data.theme} · 可见卡片 ${data.visibleCards}`
  );
  console.log(
    `  字体 中文=${data.fonts.cjk} UI=${data.fonts.ui} 标题=${data.fonts.display}（${data.fonts.loaded} 个）` +
      ` · 技能条 ${data.barWidths.join(" ") || "无"}`
  );
  highlights.forEach((line) => console.log("  ⚠ " + line));

  for (const action of ACTIONS[page] || []) {
    const out = await client.send("Runtime.evaluate", {
      expression: action.run,
      returnByValue: true
    });
    await sleep(250);
    let extra = "";
    if (action.check) {
      const res = await client.send("Runtime.evaluate", { expression: action.check, returnByValue: true });
      extra = " → " + res.result.value;
    } else if (out.result.value != null) {
      extra = " → " + out.result.value;
    }
    console.log("  · " + action.name + extra);
  }

  // 把主题恢复成浅色，避免影响后面的页面
  await client.send("Runtime.evaluate", {
    expression: `(function(){ try { localStorage.setItem('pixel-morandi', JSON.stringify({theme:'light'})); } catch(e){}
      document.documentElement.setAttribute('data-theme','light'); return true; })()`,
    returnByValue: true
  });
}

console.log(`\n共 ${PAGES.length} 个页面，${failed} 个需要处理。\n`);

/* ------------------------------------------------------------ 窄屏复查 */

console.log("=== 手机窄屏（390 × 844）复查");
await client.send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true
});

for (const page of PAGES) {
  problems.length = 0;
  const loaded = client.waitFor("Page.loadEventFired");
  await client.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/${page}` });
  await loaded;
  await sleep(700);

  const probe = await client.send("Runtime.evaluate", {
    expression: `(function () {
      var doc = document.documentElement;
      var wide = [];
      var all = document.querySelectorAll("body *");
      for (var i = 0; i < all.length; i++) {
        var node = all[i];
        var style = getComputedStyle(node);
        if (style.position === "fixed" || style.display === "none") continue;
        if (node.closest(".marquee")) continue;
        var box = node.getBoundingClientRect();
        if (box.width > 0 && box.right > window.innerWidth + 1) {
          wide.push((node.className || node.tagName) + " → " + Math.round(box.right));
        }
        if (wide.length > 3) break;
      }
      return JSON.stringify({ overflowX: doc.scrollWidth - doc.clientWidth, wide: wide });
    })()`,
    returnByValue: true
  });
  const data = JSON.parse(probe.result.value);

  // 汉堡菜单
  await client.send("Runtime.evaluate", {
    expression: `document.querySelector('[data-nav-toggle]').click(); true`,
    returnByValue: true
  });
  await sleep(300);
  const navState = await client.send("Runtime.evaluate", {
    expression: `JSON.stringify({
      open: document.querySelector('[data-nav]').classList.contains('is-open'),
      expanded: document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded'),
      visible: getComputedStyle(document.querySelector('[data-nav]')).transform
    })`,
    returnByValue: true
  });

  const bad = [];
  if (data.overflowX > 1) bad.push("横向溢出 " + data.overflowX + "px");
  if (data.wide.length) bad.push("超出：" + data.wide.join(" | "));
  if (problems.length) bad.push(...problems);

  console.log(
    `${bad.length ? "✗" : "✓"} ${page.padEnd(15)} 溢出 ${data.overflowX}px · 菜单 ${navState.result.value}`
  );
  bad.forEach((line) => console.log("   ⚠ " + line));

  await client.send("Runtime.evaluate", {
    expression: `document.querySelector('[data-nav-toggle]').click(); true`,
    returnByValue: true
  });
}

/* --------------------------------------------------------- 主题色差检查 */

console.log("\n=== 主题换色检查");
const colors = await client.send("Runtime.evaluate", {
  expression: `(function () {
    var el = document.documentElement;
    var out = {};
    el.setAttribute('data-theme', 'light');
    var light = getComputedStyle(el);
    out.light = { bg: light.getPropertyValue('--bg').trim(), ink: light.getPropertyValue('--ink').trim(),
      clay: light.getPropertyValue('--clay').trim() };
    el.setAttribute('data-theme', 'dusk');
    var dusk = getComputedStyle(el);
    out.dusk = { bg: dusk.getPropertyValue('--bg').trim(), ink: dusk.getPropertyValue('--ink').trim(),
      clay: dusk.getPropertyValue('--clay').trim() };
    el.setAttribute('data-theme', 'light');
    try { localStorage.removeItem('pixel-morandi'); } catch (e) {}
    return JSON.stringify(out);
  })()`,
  returnByValue: true
});
const themeColors = JSON.parse(colors.result.value);
console.log(`  浅色 背景 ${themeColors.light.bg} / 文字 ${themeColors.light.ink} / 强调 ${themeColors.light.clay}`);
console.log(`  暮色 背景 ${themeColors.dusk.bg} / 文字 ${themeColors.dusk.ink} / 强调 ${themeColors.dusk.clay}`);
console.log(
  themeColors.light.bg !== themeColors.dusk.bg ? "  ✓ 两套主题颜色不同" : "  ⚠ 两套主题颜色一样"
);

chrome.kill();
server.close();
process.exit(0);
