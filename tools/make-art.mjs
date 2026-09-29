/* =========================================================================
   Pixel Morandi · 像素素材生成器
   -------------------------------------------------------------------------
   这个脚本会把 assets/img/ 下的像素图重新画一遍：
     scene-day.svg  scene-night.svg   首屏风景（含云朵飘动动画）
     mark.svg                         站标（山 + 太阳）
     avatar.svg                       像素头像
     favicon.svg                      浏览器图标

   用法：node tools/make-art.mjs
   改完颜色或形状后重新跑一次就好。
   ========================================================================= */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "assets/img");
mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------------ 工具 */

// 固定种子的随机数，保证每次生成的画都一样
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const snap = (v, unit) => Math.round(v / unit) * unit;
const rect = (x, y, w, h, fill) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

// 把字符画转成 <rect> 列表
function glyph(rows, palette, unit = 1, ox = 0, oy = 0) {
  const out = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === "." || ch === " ") {
        x++;
        continue;
      }
      const fill = palette[ch];
      if (!fill) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      out.push(rect(ox + x * unit, oy + y * unit, run * unit, unit, fill));
      x += run;
    }
  });
  return out.join("");
}

// 实心像素圆：宽度取偶数格，保证左右对称
function disc(cx, cy, r, unit) {
  const out = [];
  for (let y = snap(cy - r, unit); y < cy + r; y += unit) {
    const dy = y + unit / 2 - cy;
    const half = Math.sqrt(Math.max(0, r * r - dy * dy));
    const w = Math.max(unit, 2 * Math.round(half / unit) * unit);
    out.push([cx - w / 2, y, w, unit]);
  }
  return out;
}

const discRects = (cx, cy, r, unit, fill) =>
  disc(cx, cy, r, unit)
    .map(([x, y, w, h]) => rect(x, y, w, h, fill))
    .join("");

// 用几条正弦波叠出一段山脊（两端收进地平线），再对齐到像素网格
function ridge(cols, seed, { baseline, hMin, hMax, unit }) {
  const r = rng(seed);
  const waves = [
    { k: 1, a: 1.0, p: r() * Math.PI * 2 },
    { k: 2, a: 0.52, p: r() * Math.PI * 2 },
    { k: 3, a: 0.3, p: r() * Math.PI * 2 },
    { k: 5, a: 0.16, p: r() * Math.PI * 2 }
  ];
  const norm = waves.reduce((s, w) => s + w.a, 0);
  const h = [];
  for (let i = 0; i <= cols; i++) {
    let s = 0;
    for (const w of waves) s += w.a * Math.sin((2 * Math.PI * w.k * i) / cols + w.p);
    s /= norm; // -1 .. 1
    const window = Math.pow(Math.sin((Math.PI * i) / cols), 0.55);
    const tall = hMin + (hMax - hMin) * (s * 0.5 + 0.5);
    h.push(snap(baseline - tall * window, unit));
  }
  return h;
}

// 把高度数组变成台阶状路径，返回 { path, runs }
function staircase(h, unit, baseline) {
  const runs = [];
  let i = 0;
  while (i < h.length) {
    let j = i;
    while (j + 1 < h.length && h[j + 1] === h[i]) j++;
    runs.push({ x: i, w: j - i + 1, y: h[i] });
    i = j + 1;
  }

  let d = `M${runs[0].x * unit} ${runs[0].y}`;
  let prevY = runs[0].y;
  runs.forEach((run) => {
    if (run.y !== prevY) {
      d += `V${run.y}`;
      prevY = run.y;
    }
    d += `H${(run.x + run.w) * unit}`;
  });
  d += `V${baseline}H0Z`;
  return { d, runs };
}

/* ---------------------------------------------------------- 首屏风景素材 */

const W = 320;
const H = 220;
const U = 4;

const THEMES = {
  day: {
    sky: ["#AEC0C7", "#B7C6C9", "#C2CDC9", "#CBD3C9", "#D5D8CD", "#E1DCD0", "#E9E2D4"],
    haze: "#F0E9DC",
    sun: "#D8B67C",
    sunCore: "#EBD3A0",
    dither: "rgba(255,255,255,0.5)",
    cloud: "#EFEAE0",
    cloudShade: "#D2CBC0",
    ridges: [
      { body: "#BAC6C6", top: "#C9D3D1", seed: 11, hMin: 26, hMax: 66 },
      { body: "#9FB0A0", top: "#AEBEAB", seed: 27, hMin: 16, hMax: 46 },
      { body: "#82917F", top: "#94A28F", seed: 43, hMin: 7, hMax: 26 }
    ],
    ground: { deep: "#5E6A5C", mid: "#6E7A6A", edge: "#87927F", tuft: "#7E8C77" },
    lake: { body: "#A9BCBE", top: "#C3D2D2" },
    pine: { body: "#6B7A68", dark: "#59684F", trunk: "#7A6A5C" },
    star: "#F1EAD9"
  },
  night: {
    sky: ["#333a4a", "#393f50", "#40465a", "#474d64", "#4e546b", "#555a72", "#5c6078"],
    haze: "#6B6A7C",
    sun: "#E8DFC4",
    sunCore: "#F3EDDA",
    dither: "rgba(255,255,255,0.14)",
    cloud: "#6E7186",
    cloudShade: "#5A5D72",
    ridges: [
      { body: "#48505F", top: "#565E6E", seed: 11, hMin: 26, hMax: 66 },
      { body: "#3D4A4E", top: "#4A585B", seed: 27, hMin: 16, hMax: 46 },
      { body: "#2F3B3A", top: "#3B4947", seed: 43, hMin: 7, hMax: 26 }
    ],
    ground: { deep: "#232c2b", mid: "#2b3534", edge: "#3a4644", tuft: "#37443f" },
    lake: { body: "#3d4a57", top: "#4d5d6b" },
    pine: { body: "#2b3733", dark: "#232d2a", trunk: "#3a332f" },
    star: "#F1EAD9"
  }
};

function skyBands(t) {
  const bands = [];
  const bandH = 24;
  t.sky.forEach((color, i) => {
    bands.push(rect(0, i * bandH, W, bandH, color));
  });
  // 地平线附近更亮一点，做出雾气感
  bands.push(rect(0, 144, W, bandH, t.haze));
  bands.push(rect(0, 168, W, 6, t.haze));
  return bands.join("");
}

function clouds(t) {
  const shape = (fill, shade) => {
    return [
      rect(8, 0, 20, 4, fill),
      rect(4, 4, 32, 4, fill),
      rect(0, 8, 44, 4, fill),
      rect(6, 12, 30, 4, shade), // 底部阴影
      rect(2, 12, 8, 4, fill),
      rect(34, 12, 8, 4, fill)
    ].join("");
  };

  const layers = [
    { x: -60, y: 24, s: 1, dur: 52, delay: -6 },
    { x: 120, y: 58, s: 0.7, dur: 74, delay: -30 },
    { x: 210, y: 30, s: 0.5, dur: 40, delay: -14 }
  ];

  return layers
    .map(
      (l) => `<g transform="translate(${l.x} ${l.y}) scale(${l.s})">
        <g class="cloud" style="animation-duration:${l.dur}s;animation-delay:${l.delay}s">
          ${shape(t.cloud, t.cloudShade)}
        </g>
      </g>`
    )
    .join("");
}

function stars(t, seed) {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < 16; i++) {
    const x = snap(4 + r() * (W - 16), U);
    const y = snap(4 + r() * 116, U);
    const size = r() > 0.62 ? 4 : 2;
    const delay = (r() * 4).toFixed(2);
    out.push(
      `<rect class="star" style="animation-delay:-${delay}s" x="${x}" y="${y}" width="${size}" height="${size}" fill="${t.star}"/>`
    );
  }
  return out.join("");
}

function pine(x, baseY, s, t) {
  return `<g transform="translate(${x} ${baseY}) scale(${s})">
    ${rect(-2, -26, 4, 26, t.pine.trunk)}
    ${rect(-4, -10, 8, 4, t.pine.body)}
    ${rect(-8, -14, 16, 4, t.pine.body)}
    ${rect(-12, -18, 24, 4, t.pine.dark)}
    ${rect(-6, -22, 12, 4, t.pine.dark)}
    ${rect(-2, -26, 4, 4, t.pine.dark)}
  </g>`;
}

function groundBits(t) {
  const r = rng(97);
  const out = [];
  // 草
  for (let x = 8; x < W; x += 12) {
    if (r() > 0.55) {
      out.push(rect(x, 164, 4, 4, t.ground.tuft));
      if (r() > 0.6) out.push(rect(x + 4, 160, 4, 4, t.ground.edge));
    }
  }
  // 石头
  for (let i = 0; i < 6; i++) {
    const x = snap(10 + r() * (W - 30), U);
    const y = snap(196 + r() * 18, U);
    out.push(rect(x, y, 8, 4, t.ground.edge));
    out.push(rect(x + 8, y + 4, 4, 4, t.ground.edge));
  }
  return out.join("");
}

// 站在地上的小人（两帧待机动画 + 眨眼）
const HERO_PALETTE = {
  "1": "#33333A", // 头发 / 鞋子
  "2": "#E3C9BC", // 皮肤
  "3": "#C89A87", // 衣服
  "4": "#33333A" // 眼睛
};

const HERO_BASE = [
  "..1111..",
  ".122221.",
  ".1____1.",
  ".122221.",
  "..1331..",
  ".333333.",
  "33333333",
  "33333333",
  ".333333.",
  "..3..3..",
  "..1..1.."
];

function heroFrames() {
  const open = HERO_BASE.map((row, i) => (i === 2 ? row.replace("____", "2442") : row));
  const blink = HERO_BASE.map((row, i) => (i === 2 ? row.replace("____", "2222") : row));
  const palette = { ...HERO_PALETTE };
  return { open: glyph(open, palette, U), blink: glyph(blink, palette, U) };
}

function hero() {
  const frames = heroFrames();
  const gx = 132;
  const gy = 168 - 11 * U;
  return `${rect(gx, 164, 8 * U, 4, "rgba(0,0,0,0.22)")}
    <g class="hero-idle">
    <g class="frame-open">${frames.open}</g>
    <g class="frame-blink">${frames.blink}</g>
  </g>`;
}

function scene(theme) {
  const t = THEMES[theme];
  const isNight = theme === "night";
  const body = [];

  body.push(skyBands(t));
  if (isNight) body.push(stars(t, 5));

  // 月亮：用遮罩切出月牙
  if (isNight) {
    body.push(`<g class="moon" transform="translate(248 44)">
      <g mask="url(#moonMask)">${discRects(0, 0, 16, U, t.sun)}</g>
      ${discRects(0, 0, 6, U, t.sunCore)}
    </g>`);
  } else {
    body.push(`<g class="sun" transform="translate(248 44)">
      ${discRects(0, 0, 16, U, t.sun)}
      ${discRects(0, 0, 6, U, t.sunCore)}
    </g>`);
  }

  body.push(clouds(t));

  // 三层山
  t.ridges.forEach((cfg) => {
    const h = ridge(80, cfg.seed, {
      baseline: 168,
      hMin: cfg.hMin,
      hMax: cfg.hMax,
      unit: U
    });
    const { d, runs } = staircase(h, U, 168);
    body.push(`<path d="${d}" fill="${cfg.body}"/>`);
    body.push(runs.map((r) => rect(r.x * U, r.y, r.w * U, U, cfg.top)).join(""));
  });

  // 地面
  body.push(rect(0, 168, W, 4, t.ground.edge));
  body.push(rect(0, 172, W, 4, t.ground.mid));
  body.push(rect(0, 176, W, 4, t.ground.deep));
  // 湖面
  body.push(rect(0, 180, W, 4, t.lake.top));
  body.push(rect(0, 184, W, 12, t.lake.body));
  body.push(rect(0, 196, W, 24, t.ground.deep));
  body.push(groundBits(t));

  body.push(pine(38, 172, 1.5, t));
  body.push(pine(288, 166, 1, t));
  body.push(hero());

  // 整体加一层细密方格，让颜色更像印刷品
  body.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="url(#dither)"/>`);

  const mask = isNight
    ? `<mask id="moonMask" maskUnits="userSpaceOnUse" x="-24" y="-24" width="48" height="48">
         ${discRects(0, 0, 16, U, "#fff")}
         ${discRects(12, -4, 15, U, "#000")}
       </mask>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"
  shape-rendering="crispEdges" role="img" aria-label="${isNight ? "夜色中的像素山谷" : "白天的像素山谷"}">
  <defs>
    ${mask}
    <pattern id="dither" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="2" height="2" fill="${t.dither}" opacity="0.35"/>
    </pattern>
  </defs>
  <style>
    .cloud { animation: drift linear infinite; }
    @keyframes drift {
      from { transform: translateX(0); }
      to   { transform: translateX(420px); }
    }
    .star { animation: twinkle 3.6s steps(1, end) infinite; }
    @keyframes twinkle {
      0%, 60% { opacity: 1; }
      61%, 100% { opacity: 0.25; }
    }
    .hero-idle { animation: idle 2.4s steps(1, end) infinite; }
    @keyframes idle {
      0%, 49% { transform: translate(${132}px, ${124}px); }
      50%, 100% { transform: translate(${132}px, ${128}px); }
    }
    .frame-blink { animation: blink 4.8s steps(1, end) infinite; }
    @keyframes blink {
      0%, 92% { opacity: 0; }
      93%, 97% { opacity: 1; }
      98%, 100% { opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .cloud, .star, .hero-idle, .frame-blink { animation: none; }
      .frame-blink { opacity: 0; }
    }
  </style>
  ${body.join("\n  ")}
</svg>
`;
}

/* ------------------------------------------------------------ 站标与图标 */

const MARK = [
  ".....44.....",
  ".....44.....",
  "............",
  "....22......",
  "...2222.....",
  "..222222.2..",
  ".2222222222.",
  "222222222222"
];

function markSvg() {
  const body = glyph(MARK, { "2": "#9DAF9A", "4": "#C89A87" }, 4);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" width="48" height="32"
  shape-rendering="crispEdges" role="img" aria-label="山与太阳的像素标志">
  ${body}
</svg>
`;
}

const AVATAR = [
  "................",
  "....11111111....",
  "...1222222221...",
  "..122222222221..",
  "..122222222221..",
  "..122442244221..",
  "..122222222221..",
  "..122332233221..",
  "..122223322221..",
  "...1222222221...",
  "....12222221....",
  "....11111111....",
  "..111111111111..",
  ".11111111111111.",
  "1111111111111111",
  "1111111111111111"
];

function avatarSvg() {
  const body = glyph(
    AVATAR,
    { "1": "#3A3A42", "2": "#E3C9BC", "3": "#C89A87", "4": "#3A3A42" },
    8
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"
  shape-rendering="crispEdges" role="img" aria-label="像素头像">
  <rect width="128" height="128" fill="#C3CEC2"/>
  ${body}
</svg>
`;
}

const FAVICON = [
  "1111111111111111",
  "1..............1",
  "1.........44...1",
  "1.........44...1",
  "1..............1",
  "1....22........1",
  "1...2222.......1",
  "1..222222..22..1",
  "1.222222222222.1",
  "1.222222222222.1",
  "1.333333333333.1",
  "1.333333333333.1",
  "1..............1",
  "1..............1",
  "1..............1",
  "1111111111111111"
];

function faviconSvg() {
  const body = glyph(
    FAVICON,
    { "1": "#33333A", "2": "#9DAF9A", "3": "#7C8A7E", "4": "#C89A87" },
    1
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"
  shape-rendering="crispEdges" role="img" aria-label="像素小山">
  <rect width="16" height="16" fill="#E7E3DC"/>
  ${body}
</svg>
`;
}

/* ------------------------------------------------------------------ 输出 */

const files = {
  "scene-day.svg": scene("day"),
  "scene-night.svg": scene("night"),
  "mark.svg": markSvg(),
  "avatar.svg": avatarSvg(),
  "favicon.svg": faviconSvg()
};

Object.entries(files).forEach(([name, content]) => {
  const file = resolve(OUT, name);
  writeFileSync(file, content, "utf8");
  console.log(`${name.padEnd(18)} ${(Buffer.byteLength(content) / 1024).toFixed(1)} KB`);
});
