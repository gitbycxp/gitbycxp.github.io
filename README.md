# 像素笔记 · Pixel Morandi

一个纯静态的个人小站：像素风 + 莫兰迪配色。只有 HTML、CSS、JavaScript 三种文件，
没有构建步骤、没有 npm 依赖、没有任何外部 CDN 请求，丢到任何静态服务器上都能跑。

## 页面

| 文件 | 内容 |
| --- | --- |
| `index.html` | 首屏（像素风景）、数字条、关于、技能条、精选作品、近况、联系 |
| `projects.html` | 全部作品 + 按类型筛选 |
| `about.html` | 自述、工具箱、站点说明（colophon） |
| `contact.html` | 联系方式、复制邮箱、常见问题 |
| `404.html` | GitHub Pages 会自动使用它作为找不到页面时的兜底 |

## 想改内容？

**几乎所有文字、链接、作品都写在一个文件里：[`assets/js/data.js`](assets/js/data.js)。**
打开它，按注释改就行，不需要动 HTML。

几件值得先改的事：

- `meta.siteName` / `owner.name` / `owner.handle` / `owner.email`：改成你自己的
- `meta.url`、`meta.description`：影响分享卡片和搜索摘要
- `projects.items`：作品列表，`art.rows` 是像素封面（字符画），改字符就能换图案
- `skills.groups`：技能条，`level` 是 0–100
- `stats`：首屏那四个数字
- `footer.social`、`contact.channels`：社交链接

顺带一提，`robots.txt` 和 `sitemap.xml` 里的域名也要跟着改。

### 作品封面怎么画

`art.rows` 是一组等长的字符串，每个字符是一个像素：

| 字符 | 含义 |
| --- | --- |
| `.` 或空格 | 透明 |
| `1` | 深墨色 |
| `2` | 主色（`art.palette[2]`） |
| `3` | 次色 |
| `4` | 亮色 |
| `5` | 中间灰 |

`art.palette` 是索引到颜色的映射表，`art.palette[1]` 对应字符 `1`，以此类推。

## 想改长相？

- **颜色**：`assets/css/style.css` 顶部的「设计令牌」，改 `--bg`、`--ink`、`--clay` 这些变量即可。
  浅色在 `:root`，暮色在 `html[data-theme="dusk"]`。
- **字体大小**：同样是文件顶部的 `--fs-1` ~ `--fs-4`。像素字体在整数倍缩放下最锐利，
  所以页面用 12 / 18 / 24 / 36 这套阶梯；页脚的「字号」按钮会整体放大一档。
- **像素风景 / 头像 / 站标**：由 [`tools/make-art.mjs`](tools/make-art.mjs) 生成。
  改完颜色或形状后跑一次 `node tools/make-art.mjs` 就会重画。

## 本地预览

直接双击 `index.html` 也能看，但字体可能被浏览器的本地文件策略拦住，建议起个小服务：

```bash
# 任选一种
node tools/serve.mjs        # 自带的极简服务器（见下）
python -m http.server 8080
npx serve .
```

### 自检

`tools/check.mjs` 会用无头 Chrome 打开五个页面，检查有没有 JS 报错、内容有没有渲染出来、
字体有没有加载、窄屏有没有横向溢出，并顺便点一下主题开关、筛选按钮和 FAQ：

```bash
node tools/check.mjs
```

## 部署到 GitHub Pages

这个仓库就是站点本身，不需要构建产物。

1. 把仓库命名为 `你的用户名.github.io`
2. 推送 `main` 分支
3. 打开仓库的 Settings → Pages，Source 选 `Deploy from a branch`，分支选 `main` / `root`
4. 等一两分钟，访问 `https://你的用户名.github.io/`

如果不是用户主页仓库（比如叫 `blog`），站点会挂在子路径下，本仓库用的是相对路径，所以不用改代码。
只有 `robots.txt` 和 `sitemap.xml` 里的地址需要改一下。

## 目录结构

```
.
├── index.html / projects.html / about.html / contact.html / 404.html
├── assets
│   ├── css/style.css        设计令牌、布局、组件、动效
│   ├── js/data.js           全部内容（改这里就够）
│   ├── js/site.js           渲染与交互
│   ├── img/                 由脚本生成的像素图（场景 / 头像 / 站标 / 图标）
│   └── fonts/               自托管像素字体 + 许可证
├── tools
│   ├── make-art.mjs         像素素材生成器
│   └── check.mjs            本地自检
└── robots.txt / sitemap.xml / .nojekyll
```

## 字体与许可

三款字体都是开源字体，**文件随仓库一起分发**（所以断网也不会掉字形），
二次分发时请保留 `assets/fonts/` 里的许可证文件：

| 字体 | 用途 | 许可 |
| --- | --- | --- |
| [Fusion Pixel 12px](https://github.com/TakWolf/fusion-pixel-font) | 中文正文与标题 | SIL OFL 1.1 |
| [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) | 站名、小标题 | SIL OFL 1.1 |
| [Silkscreen](https://fonts.google.com/specimen/Silkscreen) | 西文正文与界面 | SIL OFL 1.1 |

页面里的图形全部由 CSS 和内联 SVG 画成，没有位图素材。

## 小玩意

- 右上角的太阳/月亮按钮切换 **浅色 / 暮色** 两套主题，跟着系统偏好走，也能记住你的选择
- 页脚可以调 **字号** 和打开 **扫描线**（CRT 滤镜）
- 鼠标划过时会留下几个像素方块；系统开了「减少动态效果」就自动关掉
- 首屏的风景有两套：白天和夜晚，跟着主题换

---

示例作品只是占位内容，用来演示版式，换成你自己的就行。
