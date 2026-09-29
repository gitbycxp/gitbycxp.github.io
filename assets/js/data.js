/* =========================================================================
   Pixel Morandi · 站点内容配置
   -------------------------------------------------------------------------
   站点里所有的文字、链接、作品、技能都写在下面这一份文件里。
   改这里就等于改整站，不需要动 HTML 和 CSS。

   小提示：
   - 带 TODO 的地方是占位内容，换成你自己的就行。
   - 作品封面是「像素画」，用字符画出来的，改字符就能改图案：
       .  = 透明   1 = 深墨色   2 = 主色   3 = 次色   4 = 亮色   5 = 中间灰
   ========================================================================= */

(function () {
  "use strict";

  /* 全站共用色板：莫兰迪（低饱和、灰调） */
  var MORANDI = {
    ink: "#3A3A42",
    sage: "#9DAF9A",
    clay: "#C89A87",
    blue: "#94A8B6",
    pink: "#D2AFA9",
    mustard: "#C6AE79",
    plum: "#A697A9",
    paper: "#F3F0EB",
    stone: "#C9C3BA"
  };

  window.SITE = {
    /* ---------------------------------------------------------------- 基础信息 */
    meta: {
      // TODO: 换成你的名字 / 昵称
      siteName: "像素笔记",
      // TODO: 一句话介绍，会出现在浏览器标签和搜索结果里
      description:
        "一个用 HTML、CSS、JavaScript 手写的像素风个人小站，配色取自莫兰迪。零依赖、零框架、零追踪。",
      // TODO: 换成你的站点地址（部署到 username.github.io 就是下面这个格式）
      url: "https://gitbycxp.github.io/",
      // TODO: 社交平台预览图（可以留空）
      ogImage: "",
      keywords: "像素风,莫兰迪,静态网站,个人主页,HTML,CSS,JavaScript"
    },

    /* ---------------------------------------------------------------- 站主信息 */
    owner: {
      // TODO: 名字
      name: "cxp",
      // TODO: GitHub 用户名
      handle: "gitbycxp",
      // TODO: 头衔 / 一句话标签
      role: "像素爱好者 · 前端玩家",
      // TODO: 邮箱
      email: "snowwolf.sakura@gmail.com",
      avatar: "", // 留空使用内置像素头像；也可以填图片路径，如 "assets/img/me.png"
      footerNote: "用像素和莫兰迪色搭建。"
    },

    /* ---------------------------------------------------------------- 导航 */
    nav: [
      { label: "首页", href: "index.html", key: "home" },
      { label: "作品", href: "projects.html", key: "projects" },
      { label: "关于", href: "about.html", key: "about" },
      { label: "联系", href: "contact.html", key: "contact" }
    ],

    /* ---------------------------------------------------------------- 首屏 */
    hero: {
      eyebrow: "HELLO, WORLD",
      // 标题分成两行，第一行拉丁、第二行中文，视觉上更平衡
      titleTop: "PIXEL",
      titleBottom: "莫兰迪小站",
      lead: "把方块拼成世界，把颜色调成雾。这里没有框架、没有追踪、没有任何外部依赖——只有手写的三个文件：HTML、CSS、JavaScript。",
      primary: { label: "看看作品", href: "projects.html" },
      secondary: { label: "关于我", href: "about.html" }
    },

    /* 首屏下方的数字条：都是实话，可以随意改 */
    stats: [
      { value: 0, suffix: "", label: "外部依赖" },
      { value: 6, suffix: "", label: "莫兰迪主色" },
      { value: 100, suffix: "%", label: "手写前端三件套" },
      { value: null, text: "∞", label: "调像素的耐心" }
    ],

    /* ---------------------------------------------------------------- 关于 */
    about: {
      eyebrow: "ABOUT",
      title: "关于这个小站",
      paragraphs: [
        "我喜欢的界面有一个共同点：边界清楚、颜色安静。像素风给了它骨架——每一块都对齐到网格，每一个圆角都是走楼梯走出来的；莫兰迪给了它皮肤——灰调的绿、蓝、粉、陶土色，凑在一起不吵不闹。",
        "这个站点是纯静态的：没有构建工具，没有 npm 依赖，没有第三方字体 CDN，把文件夹丢到任何一台静态服务器上就能跑。像素字体也一起躺在仓库里，断网也不会变成豆腐块。"
      ],
      // 三个小卡片
      cards: [
        {
          icon: "mountain",
          title: "我在做什么",
          text: "写点小工具、做点小页面，琢磨怎么用最朴素的技术做出有一点分量的东西。"
        },
        {
          icon: "heart",
          title: "我喜欢什么",
          text: "8-bit 游戏的界面、旧系统的窗口、方格纸、低饱和的配色，还有对齐得很整齐的东西。"
        },
        {
          icon: "star",
          title: "我在学什么",
          text: "CSS 的奇技淫巧、Canvas 绘图、无障碍设计，以及怎么让动画不烦人。"
        }
      ]
    },

    /* ---------------------------------------------------------------- 技能条 */
    skills: {
      eyebrow: "SKILLS",
      title: "工具箱熟练度",
      lead: "进度条纯装饰，不代表评分——只是想让页面有东西可以动起来。",
      groups: [
        {
          name: "前端",
          items: [
            { name: "HTML / 语义化", level: 90, color: "sage" },
            { name: "CSS / 布局与动画", level: 85, color: "clay" },
            { name: "JavaScript / 原生", level: 78, color: "blue" },
            { name: "Canvas / 像素绘制", level: 70, color: "plum" }
          ]
        },
        {
          name: "设计与手感",
          items: [
            { name: "配色 / 莫兰迪调色", level: 82, color: "pink" },
            { name: "像素画 / 图标", level: 74, color: "mustard" },
            { name: "排版 / 网格", level: 68, color: "sage" },
            { name: "无障碍与响应式", level: 62, color: "blue" }
          ]
        }
      ]
    },

    /* ---------------------------------------------------------------- 作品
       每件作品：
         kind  用于首页和作品页的筛选（全部 / 网页 / 工具 / 游戏 / 组件）
         art   像素封面，palette 是 5 个颜色 + rows 是字符画
         links 可以只留一个，空字符串会被自动隐藏
    */
    projects: {
      eyebrow: "WORKS",
      title: "作品橱窗",
      lead: "下面这些是示例内容，换成你自己的项目就行——封面会跟着字符画一起变。",
      filters: ["全部", "网页", "工具", "游戏", "组件"],
      items: [
        {
          id: "pixel-breeze",
          title: "PixelBreeze",
          subtitle: "像素风落地页模板",
          desc: "一套只用 CSS 画出来的像素风组件：按钮、卡片、进度条、对话框，没有任何图片资源。",
          kind: "网页",
          tags: ["HTML", "CSS"],
          repo: "https://github.com/gitbycxp",
          demo: "",
          featured: true,
          art: {
            palette: ["2", MORANDI.blue, MORANDI.sage, MORANDI.paper, MORANDI.stone],
            rows: [
              "............",
              ".....44.....",
              "....4444....",
              "...444444...",
              "..44444444..",
              ".4444444444.",
              "444444444444",
              "333333333333",
              "222222222222",
              "111111111111",
              "............",
              "............"
            ]
          }
        },
        {
          id: "morandi-palette",
          title: "Morandi Palette",
          subtitle: "莫兰迪配色工具",
          desc: "拖几个色块就能生成一整套低饱和配色，并导出成 CSS 变量。",
          kind: "工具",
          tags: ["JavaScript", "色彩"],
          repo: "https://github.com/gitbycxp",
          demo: "",
          featured: true,
          art: {
            palette: ["2", MORANDI.ink, MORANDI.clay, MORANDI.pink, MORANDI.mustard],
            rows: [
              "............",
              "..33333333..",
              "..32222223..",
              "..32333323..",
              "..32333323..",
              "..32222223..",
              "..33333333..",
              "...444444...",
              "...444444...",
              "....4444....",
              ".....44.....",
              "............"
            ]
          }
        },
        {
          id: "pix-pet",
          title: "PixPet",
          subtitle: "画布像素宠物",
          desc: "用 Canvas 一格一格画出来的一只小猫，会眨眼、会跟着鼠标转头。",
          kind: "游戏",
          tags: ["Canvas", "像素画"],
          repo: "https://github.com/gitbycxp",
          demo: "",
          featured: true,
          art: {
            palette: ["2", MORANDI.ink, MORANDI.clay, MORANDI.mustard, MORANDI.paper],
            rows: [
              "............",
              "..1......1..",
              ".11......11.",
              ".122....221.",
              ".1222222221.",
              ".1242222421.",
              ".1222222221.",
              ".1223223221.",
              "..12222221..",
              "...111111...",
              "............",
              "............"
            ]
          }
        },
        {
          id: "pixel-note",
          title: "PixelNote",
          subtitle: "极简像素博客主题",
          desc: "给静态生成器用的博客主题，正文可读性优先，装饰元素全部像素化。",
          kind: "网页",
          tags: ["CSS", "主题"],
          repo: "https://github.com/gitbycxp",
          demo: "",
          art: {
            palette: ["2", MORANDI.ink, MORANDI.sage, MORANDI.stone, MORANDI.paper],
            rows: [
              "111111111111",
              "144344344341",
              "111111111111",
              "155555555551",
              "155555555551",
              "133333333331",
              "155555555551",
              "155555555551",
              "133333333331",
              "155555555551",
              "111111111111",
              "............"
            ]
          }
        },
        {
          id: "pomo-term",
          title: "PomoTerm",
          subtitle: "终端风番茄钟",
          desc: "长得像命令行窗口的计时器，提醒音是 8-bit 方波。",
          kind: "工具",
          tags: ["JavaScript", "Web Audio"],
          repo: "https://github.com/gitbycxp",
          demo: "",
          art: {
            palette: ["2", MORANDI.ink, MORANDI.plum, MORANDI.paper, MORANDI.stone],
            rows: [
              "111111111111",
              "133333333331",
              "111111111111",
              "155555555551",
              "155444455551",
              "155555555551",
              "155555555551",
              "155444455551",
              "155555555551",
              "111111111111",
              "............",
              "............"
            ]
          }
        },
        {
          id: "pixel-sky",
          title: "PixelSky",
          subtitle: "像素天气小组件",
          desc: "把天气数据画成 12×12 的像素图标，晴雨雪都是一个个方块堆出来的。",
          kind: "组件",
          tags: ["API", "SVG"],
          repo: "https://github.com/gitbycxp",
          demo: "",
          art: {
            palette: ["2", MORANDI.ink, MORANDI.mustard, MORANDI.blue, MORANDI.paper],
            rows: [
              "............",
              ".....22.....",
              "....2222....",
              "...222222...",
              "....2222....",
              ".....22.....",
              "............",
              "....3333....",
              "...333333...",
              "..44444444..",
              ".4444444444.",
              "111111111111"
            ]
          }
        },
        {
          id: "key-type",
          title: "KeyType",
          subtitle: "像素打字练习",
          desc: "复古键盘布局，敲对了方块会亮起来，敲错了会抖一下。",
          kind: "工具",
          tags: ["JavaScript", "交互"],
          repo: "https://github.com/gitbycxp",
          demo: "",
          art: {
            palette: ["2", MORANDI.ink, MORANDI.blue, MORANDI.paper, MORANDI.stone],
            rows: [
              "............",
              "111111111111",
              "133333333331",
              "133232323331",
              "133333333331",
              "133232332331",
              "133333333331",
              "133333333331",
              "111111111111",
              "............",
              "............",
              "............"
            ]
          }
        },
        {
          id: "pixel-2048",
          title: "Pixel2048",
          subtitle: "复古 2048",
          desc: "用网格和 transitions 重做的经典数字游戏，配色换成了莫兰迪。",
          kind: "游戏",
          tags: ["JavaScript", "游戏"],
          repo: "https://github.com/gitbycxp",
          demo: "",
          art: {
            palette: ["2", MORANDI.ink, MORANDI.clay, MORANDI.sage, MORANDI.paper],
            rows: [
              "111111111111",
              "144244224431",
              "111111111111",
              "133322233331",
              "133322233331",
              "111111111111",
              "144322244431",
              "144322244431",
              "111111111111",
              "............",
              "............",
              "............"
            ]
          }
        }
      ]
    },

    /* ---------------------------------------------------------------- 关注方向 */
    focus: {
      eyebrow: "NOW",
      title: "最近在忙的事",
      items: [
        {
          icon: "mountain",
          title: "补齐这座小站",
          text: "把像素场景、动效、暗色模式都打磨一遍，让它经得起反复看。"
        },
        {
          icon: "star",
          title: "做一套像素图标",
          text: "用字符画的方式把常用图标整理成一份可以复用的素材。"
        },
        {
          icon: "heart",
          title: "读一点配色书",
          text: "想弄明白莫兰迪色为什么耐看，然后写进 CSS 变量里。"
        }
      ],
      terminal: {
        title: "~/status",
        lines: [
          { cmd: true, text: "whoami" },
          { cmd: false, text: "一个喜欢方块和低饱和的人" },
          { cmd: true, text: "cat stack.txt" },
          { cmd: false, text: "HTML · CSS · JavaScript · 手写" },
          { cmd: true, text: "echo $DEPENDENCIES" },
          { cmd: false, text: "0" },
          { cmd: true, text: "uptime" },
          { cmd: false, text: "一直在，只是偶尔重开" }
        ]
      }
    },

    /* ---------------------------------------------------------------- 关于页：工具箱 */
    toolbox: {
      eyebrow: "TOOLBOX",
      title: "常用工具",
      groups: [
        {
          name: "写代码",
          items: ["VS Code", "Git", "Chrome DevTools", "PowerShell"]
        },
        {
          name: "画像素",
          items: ["Aseprite", "Piskel", "Figma", "方格纸"]
        },
        {
          name: "配色",
          items: ["莫兰迪色卡", "Coolors", "系统取色器", "色轮"]
        },
        {
          name: "日常",
          items: ["Notion", "白噪音", "咖啡", "散步"]
        }
      ]
    },

    /* ---------------------------------------------------------------- 关于页：网站信息 */
    siteInfo: {
      eyebrow: "COLOPHON",
      title: "这个站是怎么做的",
      rows: [
        { key: "技术", value: "纯 HTML + CSS + JavaScript，无构建、无框架" },
        { key: "字体", value: "Press Start 2P、Silkscreen、Fusion Pixel（均为开源字体，随仓库一起分发）" },
        { key: "配色", value: "莫兰迪低饱和色，浅色与暮色两套主题" },
        { key: "图形", value: "全部由 CSS 与内联 SVG 绘制，没有位图素材" },
        { key: "脚本", value: "原生 JS，约 10 KB，无任何网络请求" },
        { key: "托管", value: "GitHub Pages" }
      ]
    },

    /* ---------------------------------------------------------------- 联系页 */
    contact: {
      eyebrow: "CONTACT",
      title: "来打个招呼",
      lead: "邮件最靠谱。如果只是想聊聊像素画或者配色，也欢迎。",
      channels: [
        {
          icon: "mail",
          label: "邮箱",
          value: "snowwolf.sakura@gmail.com",
          href: "mailto:snowwolf.sakura@gmail.com",
          note: "优先回这个"
        },
        {
          icon: "github",
          label: "GitHub",
          value: "@gitbycxp",
          href: "https://github.com/gitbycxp",
          note: "代码都在这里"
        }
      ],
      faq: [
        {
          q: "可以借用这个站的代码吗？",
          a: "可以，随便拿。不过字体各有各的开源协议，二次使用时记得保留许可文件。"
        },
        {
          q: "会加评论区和统计吗？",
          a: "暂时不会。静态站点最好玩的地方就是它什么都不依赖，没有后端，也没有埋点。"
        }
      ]
    },

    /* ---------------------------------------------------------------- 页脚 */
    footer: {
      links: [
        { label: "首页", href: "index.html" },
        { label: "作品", href: "projects.html" },
        { label: "关于", href: "about.html" },
        { label: "联系", href: "contact.html" }
      ],
      social: [
        { label: "GitHub", href: "https://github.com/gitbycxp" },
        { label: "Email", href: "mailto:snowwolf.sakura@gmail.com" }
      ]
    },

    /* ---------------------------------------------------------------- 走马灯文字 */
    marquee: [
      "HTML",
      "CSS",
      "JAVASCRIPT",
      "NO DEPENDENCY",
      "MORANDI",
      "8-BIT",
      "HANDMADE",
      "NO TRACKING",
      "PIXEL PERFECT"
    ]
  };
})();
