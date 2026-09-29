/* =========================================================================
   Pixel Morandi · 站点脚本
   -------------------------------------------------------------------------
   原生 JavaScript，没有依赖。主要做四件事：
     1. 把 data.js 里的内容渲染成页面
     2. 主题 / 字号 / 扫描线三个开关
     3. 滚动出现、进度条、数字滚动、技能条
     4. 一些像素风的小玩意：鼠标轨迹、复制提示
   ========================================================================= */

(function () {
  "use strict";

  var S = window.SITE || {};
  var root = document.documentElement;
  var body = document.body;
  var page = body.getAttribute("data-page") || "home";

  var $ = function (sel, scope) {
    return (scope || document).querySelector(sel);
  };
  var $$ = function (sel, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  };
  var mq = window.matchMedia ? window.matchMedia.bind(window) : null;
  var reduced = mq ? mq("(prefers-reduced-motion: reduce)").matches : false;
  var coarse = mq ? mq("(pointer: coarse)").matches : false;

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function cssVar(name) {
    return getComputedStyle(root).getPropertyValue(name).trim() || "#888888";
  }

  /* ------------------------------------------------------- 像素图形渲染 */

  // 把字符画渲染成 SVG
  function pixelArt(art, opts) {
    var options = opts || {};
    var palette = art.palette || [];
    var rows = art.rows || [];
    var h = rows.length;
    var w = rows.reduce(function (max, row) {
      return Math.max(max, row.length);
    }, 0);
    var out = [];
    for (var y = 0; y < h; y++) {
      var row = rows[y];
      var x = 0;
      while (x < row.length) {
        var ch = row.charAt(x);
        if (ch === "." || ch === " " || ch === "0") {
          x++;
          continue;
        }
        var fill = palette[Number(ch)];
        if (!fill) {
          x++;
          continue;
        }
        var run = 1;
        while (x + run < row.length && row.charAt(x + run) === ch) run++;
        out.push(
          '<rect x="' + x + '" y="' + y + '" width="' + run + '" height="1" fill="' + fill + '"/>'
        );
        x += run;
      }
    }
    var bg =
      '<rect width="' + w + '" height="' + h + '" fill="' + (art.bg || "var(--surface-2)") + '"/>';
    return (
      '<svg viewBox="0 0 ' +
      w +
      " " +
      h +
      '" preserveAspectRatio="' +
      (options.fit || "xMidYMid slice") +
      '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' +
      bg +
      out.join("") +
      "</svg>"
    );
  }

  // 小图标：1 = 墨色，2 = 纸色，3 = 强调色
  var ICONS = {
    mountain: [
      "............",
      "........22..",
      "........22..",
      "............",
      "....11......",
      "...1111.....",
      "..111111....",
      ".11111111...",
      "1111111111..",
      "............",
      "............",
      "............"
    ],
    heart: [
      "............",
      "..222..222..",
      ".2222222222.",
      "222222222222",
      "222222222222",
      "222222222222",
      ".2222222222.",
      "..22222222..",
      "...222222...",
      "....2222....",
      ".....22.....",
      "............"
    ],
    star: [
      ".....22.....",
      ".....22.....",
      "....2222....",
      "222222222222",
      ".2222222222.",
      "..22222222..",
      "...222222...",
      "..22222222..",
      "..22....22..",
      ".22......22.",
      "............",
      "............"
    ],
    mail: [
      "............",
      "111111111111",
      "133333333331",
      "113333333311",
      "131333333131",
      "133133331331",
      "133313313331",
      "133331133331",
      "133333333331",
      "111111111111",
      "............",
      "............"
    ],
    github: [
      "............",
      "..11....11..",
      ".1111..1111.",
      ".1111111111.",
      "111111111111",
      "113311331111",
      "111111111111",
      "111111111111",
      ".1111111111.",
      "..11111111..",
      "...111111...",
      "............"
    ]
  };

  function iconSVG(name, accent) {
    var rows = ICONS[name] || ICONS.star;
    var art = {
      rows: rows.map(function (row) {
        return row.replace(/2/g, "3");
      }),
      palette: {
        "1": "var(--ink)",
        "2": "var(--ink)",
        "3": "var(" + (accent || "--clay") + ")"
      }
    };
    return pixelArt(art, { fit: "xMidYMid meet" });
  }

  /* ------------------------------------------------------------ 内容绑定 */

  function lookup(path) {
    return path.split(".").reduce(function (obj, key) {
      return obj == null ? undefined : obj[key];
    }, S);
  }

  function applyBindings() {
    $$("[data-bind]").forEach(function (node) {
      var value = lookup(node.getAttribute("data-bind"));
      if (typeof value === "string" || typeof value === "number") node.textContent = value;
    });

    $$("*").forEach(function (node) {
      var attrs = node.getAttributeNames().filter(function (name) {
        return name.indexOf("data-bind-") === 0;
      });
      attrs.forEach(function (attr) {
        var target = attr.slice("data-bind-".length);
        var value = lookup(node.getAttribute(attr));
        if (value == null) {
          return;
        }
        if (target === "text") {
          node.textContent = value;
        } else {
          node.setAttribute(target, value);
        }
      });
    });
  }

  /* ---------------------------------------------------------------- 页头 */

  function renderNav() {
    var nav = $("[data-nav]");
    if (!nav || !S.nav) return;
    nav.innerHTML = S.nav
      .map(function (item) {
        var current = item.key === page ? ' aria-current="page"' : "";
        return '<li><a class="site-nav__link" href="' + item.href + '"' + current + ">" +
          esc(item.label) +
          "</a></li>";
      })
      .join("");
  }

  function setupNavToggle() {
    var toggle = $("[data-nav-toggle]");
    var nav = $("[data-nav]");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      body.style.overflow = open && window.innerWidth <= 780 ? "hidden" : "";
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 780) setOpen(false);
    });
  }

  /* ------------------------------------------------------- 主题与显示开关 */

  var STORE_KEY = "pixel-morandi";

  function store(patch) {
    var state = {};
    try {
      state = JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
    } catch (err) {
      state = {};
    }
    Object.keys(patch).forEach(function (key) {
      state[key] = patch[key];
    });
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (err) {
      /* 隐私模式下忽略 */
    }
  }

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
    } catch (err) {
      return {};
    }
  }

  function setTheme(theme, save) {
    root.setAttribute("data-theme", theme);
    var label = theme === "dusk" ? "切换到浅色" : "切换到暮色";
    $$("[data-theme-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      btn.setAttribute("aria-pressed", theme === "dusk" ? "true" : "false");
    });
    $$("[data-theme-name]").forEach(function (node) {
      node.textContent = theme === "dusk" ? "暮色" : "浅色";
    });
    $$("[data-theme-glyph]").forEach(function (node) {
      node.className = "px-icon px-icon--" + (theme === "dusk" ? "moon" : "sun");
    });
    if (save) store({ theme: theme });
  }

  function setupDisplayControls() {
    $$("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setTheme(root.getAttribute("data-theme") === "dusk" ? "light" : "dusk", true);
      });
    });

    $$("[data-text-toggle]").forEach(function (btn) {
      var large = root.getAttribute("data-text") === "large";
      btn.setAttribute("aria-pressed", large ? "true" : "false");
      btn.textContent = large ? "字号：大" : "字号：标准";
      btn.addEventListener("click", function () {
        var next = root.getAttribute("data-text") === "large" ? "normal" : "large";
        root.setAttribute("data-text", next);
        btn.setAttribute("aria-pressed", next === "large" ? "true" : "false");
        btn.textContent = next === "large" ? "字号：大" : "字号：标准";
        store({ text: next });
      });
    });

    $$("[data-crt-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", body.classList.contains("is-crt") ? "true" : "false");
      btn.addEventListener("click", function () {
        var on = body.classList.toggle("is-crt");
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        store({ crt: on });
      });
    });
  }

  /* ------------------------------------------------------------ 通用动效 */

  function setupProgress() {
    var bar = $("[data-progress]");
    if (!bar) return;
    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, window.pageYOffset / max) : 0;
      bar.style.width = (ratio * 100).toFixed(2) + "%";
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }

  var observer = null;

  function observe(node, onIn) {
    if (!("IntersectionObserver" in window)) {
      onIn(node);
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            var fn = entry.target.__onIn;
            if (fn) fn(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
      );
    }
    node.__onIn = onIn;
    observer.observe(node);
  }

  function setupReveal() {
    $$("[data-reveal]").forEach(function (node) {
      if (reduced) return;
      node.classList.add("reveal");
      var delay = parseInt(node.getAttribute("data-reveal-delay") || "0", 10);
      if (delay) node.style.transitionDelay = delay * 90 + "ms";
      observe(node, function (target) {
        target.classList.add("is-in");
      });
    });
  }

  /* ------------------------------------------------------------ 数字滚动 */

  function setupCounters() {
    $$("[data-count]").forEach(function (node) {
      var target = parseInt(node.getAttribute("data-count"), 10);
      if (isNaN(target)) return;
      var suffix = node.getAttribute("data-suffix") || "";
      if (reduced || target === 0) {
        node.textContent = target + suffix;
        return;
      }
      node.textContent = "0" + suffix;
      observe(node, function () {
        var start = performance.now();
        var dur = 900;
        function tick(now) {
          var t = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - t, 3);
          node.textContent = Math.round(target * eased) + suffix;
          if (t < 1) window.requestAnimationFrame(tick);
        }
        window.requestAnimationFrame(tick);
      });
    });
  }

  /* ------------------------------------------------------------ 技能进度 */

  function renderSkills() {
    var host = $("[data-skills]");
    if (!host || !S.skills) return;
    host.innerHTML = S.skills.groups
      .map(function (group, gi) {
        var items = group.items
          .map(function (item) {
            return (
              '<div class="skill">' +
              '<div class="skill__top">' +
              '<span class="skill__name">' + esc(item.name) + "</span>" +
              '<span class="skill__val">' + item.level + "%</span>" +
              "</div>" +
              '<div class="bar"><div class="bar__fill" data-color="' + (item.color || "sage") +
              '" data-level="' + item.level + '"></div></div>' +
              "</div>"
            );
          })
          .join("");
        return (
          '<div class="skill-group" data-reveal data-reveal-delay="' + gi + '">' +
          '<h3 class="skill-group__name">' + esc(group.name) + "</h3>" +
          items +
          "</div>"
        );
      })
      .join("");

    $$("[data-level]", host).forEach(function (fill) {
      var level = fill.getAttribute("data-level") + "%";
      observe(fill, function () {
        fill.style.width = level;
      });
    });
  }

  /* -------------------------------------------------------------- 作品卡片 */

  function projectCard(item, accentIndex) {
    var accents = ["--clay", "--sage", "--blue", "--plum", "--mustard", "--pink"];
    var accent = accents[accentIndex % accents.length];
    var links = [];
    if (item.demo) {
      links.push(
        '<a class="card__link" href="' + item.demo + '" rel="noopener">在线预览<span class="btn__arrow">▸</span></a>'
      );
    }
    if (item.repo) {
      links.push(
        '<a class="card__link" href="' + item.repo + '" rel="noopener">源码<span class="btn__arrow">▸</span></a>'
      );
    }
    var tags = (item.tags || [])
      .map(function (tag) {
        return '<span class="tag">' + esc(tag) + "</span>";
      })
      .join("");

    return (
      '<article class="card" data-kind="' + esc(item.kind) + '" data-reveal>' +
      '<div class="card__thumb">' +
      '<span class="card__kind">' + esc(item.kind) + "</span>" +
      pixelArt(item.art || {}, { fit: "xMidYMid meet" }) +
      "</div>" +
      '<div class="card__body">' +
      '<h3 class="card__title">' + esc(item.title) + "</h3>" +
      '<p class="card__sub">' + esc(item.subtitle || "") + "</p>" +
      '<p class="card__desc">' + esc(item.desc) + "</p>" +
      '<div class="tag-row">' + tags + "</div>" +
      '<div class="card__foot">' + links.join("") + "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function renderProjects() {
    var host = $("[data-projects]");
    if (!host || !S.projects) return;
    var items = S.projects.items || [];
    if (host.getAttribute("data-projects") === "featured") {
      var featured = items.filter(function (item) {
        return item.featured;
      });
      items = featured.length ? featured : items.slice(0, 3);
    }
    host.innerHTML = items
      .map(function (item, index) {
        return projectCard(item, index);
      })
      .join("");

    var count = $("[data-project-count]");
    if (count) count.textContent = String((S.projects.items || []).length);
  }

  function setupFilters() {
    var bar = $("[data-filters]");
    var host = $("[data-projects]");
    if (!bar || !host || !S.projects) return;

    bar.innerHTML = (S.projects.filters || [])
      .map(function (label, index) {
        return (
          '<button class="filter-btn" type="button" data-filter="' + esc(label) +
          '" aria-pressed="' + (index === 0 ? "true" : "false") + '">' + esc(label) + "</button>"
        );
      })
      .join("");

    var empty = $("[data-projects-empty]");

    bar.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-filter]");
      if (!btn) return;
      var value = btn.getAttribute("data-filter");
      $$("[data-filter]", bar).forEach(function (other) {
        other.setAttribute("aria-pressed", other === btn ? "true" : "false");
      });
      var visible = 0;
      $$("[data-kind]", host).forEach(function (card) {
        var show = value === "全部" || card.getAttribute("data-kind") === value;
        card.hidden = !show;
        if (show) visible++;
      });
      if (empty) empty.hidden = visible > 0;
    });
  }

  /* -------------------------------------------------------- 卡片 / 终端等 */

  function renderFocus() {
    var host = $("[data-focus]");
    if (!host || !S.focus) return;
    var accents = ["--clay", "--sage", "--blue", "--plum"];
    host.innerHTML = (S.focus.items || [])
      .map(function (item, index) {
        return (
          '<article class="mini-card" data-reveal data-reveal-delay="' + index + '">' +
          '<div class="mini-card__icon">' + iconSVG(item.icon, accents[index % accents.length]) + "</div>" +
          "<h3>" + esc(item.title) + "</h3>" +
          "<p>" + esc(item.text) + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderTerminal() {
    var host = $("[data-terminal]");
    if (!host || !S.focus || !S.focus.terminal) return;
    var term = S.focus.terminal;
    host.innerHTML =
      '<div class="term__bar">' +
      '<span class="term__dot"></span><span class="term__dot term__dot--b"></span>' +
      '<span class="term__dot term__dot--c"></span>' +
      '<span class="term__title">' + esc(term.title) + "</span>" +
      "</div>" +
      '<div class="term__body">' +
      (term.lines || [])
        .map(function (line) {
          return (
            '<div class="term__line">' +
            '<span class="term__prompt">' + (line.cmd ? "$" : "&gt;") + "</span>" +
            "<span>" + esc(line.text) + "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div>";
  }

  function renderAbout() {
    var cards = $("[data-about-cards]");
    if (cards && S.about) {
      var accents = ["--clay", "--sage", "--blue"];
      cards.innerHTML = (S.about.cards || [])
        .map(function (card, index) {
          return (
            '<article class="mini-card" data-reveal data-reveal-delay="' + index + '">' +
            '<div class="mini-card__icon">' + iconSVG(card.icon, accents[index % accents.length]) + "</div>" +
            "<h3>" + esc(card.title) + "</h3>" +
            "<p>" + esc(card.text) + "</p>" +
            "</article>"
          );
        })
        .join("");
    }

    var prose = $("[data-about-text]");
    if (prose && S.about) {
      prose.innerHTML = (S.about.paragraphs || [])
        .map(function (text) {
          return "<p>" + esc(text) + "</p>";
        })
        .join("");
    }

    var portrait = $("[data-portrait]");
    if (portrait) {
      var avatar = (S.owner && S.owner.avatar) || "assets/img/avatar.svg";
      portrait.innerHTML =
        '<img src="' + avatar + '" width="128" height="128" alt="像素头像" loading="lazy">';
    }
  }

  function renderToolbox() {
    var host = $("[data-toolbox]");
    if (!host || !S.toolbox) return;
    host.innerHTML = (S.toolbox.groups || [])
      .map(function (group, index) {
        var items = group.items
          .map(function (item) {
            return "<li>" + esc(item) + "</li>";
          })
          .join("");
        return (
          '<div data-reveal data-reveal-delay="' + index + '">' +
          '<h3 class="tool-group__name">' + esc(group.name) + "</h3>" +
          '<ul class="tool-list">' + items + "</ul>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderSiteInfo() {
    var host = $("[data-site-info]");
    if (!host || !S.siteInfo) return;
    host.innerHTML = (S.siteInfo.rows || [])
      .map(function (row) {
        return (
          '<div class="info-list__row">' +
          '<div class="info-list__key">' + esc(row.key) + "</div>" +
          '<div class="info-list__val">' + esc(row.value) + "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderContact() {
    var host = $("[data-channels]");
    if (!host || !S.contact) return;
    host.innerHTML = (S.contact.channels || [])
      .map(function (item, index) {
        var accents = ["--clay", "--blue", "--sage"];
        var inner =
          '<div class="contact-card__icon">' + iconSVG(item.icon, accents[index % accents.length]) + "</div>" +
          "<div>" +
          '<div class="contact-card__label">' + esc(item.label) + "</div>" +
          '<div class="contact-card__value">' + esc(item.value) + "</div>" +
          '<div class="contact-card__note">' + esc(item.note || "") + "</div>" +
          "</div>";
        return item.href
          ? '<a class="contact-card" href="' + item.href + '" data-reveal data-reveal-delay="' + index + '">' + inner + "</a>"
          : '<div class="contact-card" data-reveal data-reveal-delay="' + index + '">' + inner + "</div>";
      })
      .join("");

    var faq = $("[data-faq]");
    if (faq) {
      faq.innerHTML = (S.contact.faq || [])
        .map(function (item, index) {
          return (
            '<div class="faq__item" data-faq-item>' +
            '<button class="faq__q" type="button" aria-expanded="false">' + esc(item.q) + "</button>" +
            '<div class="faq__a">' + esc(item.a) + "</div>" +
            "</div>"
          );
        })
        .join("");

      faq.addEventListener("click", function (event) {
        var btn = event.target.closest(".faq__q");
        if (!btn) return;
        var item = btn.parentNode;
        var open = item.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
  }

  function renderFooter() {
    var links = $("[data-footer-links]");
    if (links && S.footer) {
      links.innerHTML = (S.footer.links || [])
        .map(function (item) {
          return '<li><a href="' + item.href + '">' + esc(item.label) + "</a></li>";
        })
        .join("");
    }

    var social = $("[data-footer-social]");
    if (social && S.footer) {
      social.innerHTML = (S.footer.social || [])
        .map(function (item) {
          return '<li><a href="' + item.href + '" rel="noopener">' + esc(item.label) + "</a></li>";
        })
        .join("");
    }

    var year = $("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());

    var handle = $("[data-handle]");
    if (handle && S.owner) handle.textContent = "@" + S.owner.handle;
  }

  function renderMarquee() {
    var track = $("[data-marquee]");
    if (!track || !S.marquee) return;
    var items = S.marquee
      .map(function (text) {
        return '<span class="marquee__item">' + esc(text) + "</span>";
      })
      .join("");
    // 复制两份，动画位移 50% 时刚好无缝衔接
    track.innerHTML =
      '<div class="marquee__group">' + items + "</div>" +
      '<div class="marquee__group" aria-hidden="true">' + items + "</div>";
  }

  function renderStats() {
    var host = $("[data-stats]");
    if (!host || !S.stats) return;
    host.innerHTML = S.stats
      .map(function (item) {
        var inner =
          item.value == null
            ? '<span class="stat__num">' + esc(item.text || "—") + "</span>"
            : '<span class="stat__num" data-count="' + item.value + '" data-suffix="' +
              esc(item.suffix || "") + '">0</span>';
        return '<div class="stat">' + inner + '<span class="stat__label">' + esc(item.label) + "</span></div>";
      })
      .join("");
  }

  /* ---------------------------------------------------- 复制、提示与彩蛋 */

  function toast(message) {
    var node = $(".toast");
    if (!node) {
      node = el("div", "toast");
      body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add("is-visible");
    window.clearTimeout(node.__timer);
    node.__timer = window.setTimeout(function () {
      node.classList.remove("is-visible");
    }, 2200);
  }

  function setupCopy() {
    $$("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        var done = function () {
          toast("已复制：" + text);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {
            toast("复制失败，请手动选择");
          });
        } else {
          var input = el("input");
          input.value = text;
          body.appendChild(input);
          input.select();
          try {
            document.execCommand("copy");
            done();
          } catch (err) {
            toast("复制失败，请手动选择");
          }
          body.removeChild(input);
        }
      });
    });
  }

  // 鼠标经过时留下几个像素方块
  function setupSparkles() {
    if (reduced || coarse) return;
    var canvas = $("[data-sparkles]");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var parts = [];
    var palette = ["--clay", "--sage", "--blue", "--mustard", "--plum"];
    var colors = palette.map(cssVar);
    var running = false;
    var lastX = -99;
    var lastY = -99;
    var lastTime = 0;

    function resize() {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      parts = parts.filter(function (p) {
        p.life -= 0.055;
        if (p.life <= 0) return false;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        return true;
      });
      ctx.globalAlpha = 1;
      if (parts.length) {
        window.requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    window.addEventListener(
      "pointermove",
      function (event) {
        var now = performance.now();
        var moved = Math.abs(event.clientX - lastX) + Math.abs(event.clientY - lastY);
        if (now - lastTime < 45 || moved < 18) return;
        lastTime = now;
        lastX = event.clientX;
        lastY = event.clientY;
        if (parts.length > 28) parts.shift();
        parts.push({
          x: Math.round(event.clientX / 4) * 4 + (Math.random() > 0.5 ? 4 : -4),
          y: Math.round(event.clientY / 4) * 4 + (Math.random() > 0.5 ? 4 : -4),
          life: 0.85,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
        if (!running) {
          running = true;
          window.requestAnimationFrame(frame);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "resize",
      function () {
        resize();
      },
      { passive: true }
    );

    // 换主题时重新取一次颜色
    $$("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        colors = palette.map(cssVar);
      });
    });

    resize();
  }

  /* ---------------------------------------------------------------- 启动 */

  function init() {
    var saved = readStore();
    if (saved.crt) body.classList.add("is-crt");

    applyBindings();
    renderNav();
    setupNavToggle();
    setupDisplayControls();
    renderStats();
    renderSkills();
    renderProjects();
    setupFilters();
    renderFocus();
    renderTerminal();
    renderAbout();
    renderToolbox();
    renderSiteInfo();
    renderContact();
    renderFooter();
    renderMarquee();
    setupCopy();
    setupProgress();
    setupCounters();
    setupSparkles();
    setupReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
