# 烟波 Yanbo

一个数字游民的博客。站点：[yanbowa.ng](https://yanbowa.ng)

Drop out · Digital Nomad · Writer · Photographer

---

## 这是什么

个人站点，用来放文章、旅行轨迹、照片，以及一点「我现在在干嘛」。首页还有实时持仓看板。

| 路径 | 页面 |
| --- | --- |
| `/` | 首页：问候、旅行地图、近期笔墨、持仓 |
| `/blog` | 文章列表 |
| `/blog/:slug` | 文章正文 |
| `/photos` | 照片墙 |
| `/about` | 关于我 |
| `/now` | 现在在哪、在做什么 |
| `/friends` | 友链 |
| `/rss.xml` | RSS |

暗色模式、多语言（Google 翻译）、胶片颗粒底纹，以及一个藏起来的彩蛋。

## 技术栈

React 18 · TypeScript · Vite 6 · Tailwind CSS · Framer Motion · React Router

文章用 Markdown 写，构建时编译成 JSON。部署在 GitHub Pages，自定义域名 `yanbowa.ng`。

## 本地开发

需要 Node.js 22。

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。

其他命令：

```bash
npm run build    # 编译文章 + 类型检查 + 打包
npm run preview  # 预览生产构建
npm run lint
npm run check    # 只做 TypeScript 检查
```

`npm run build` 会先跑 `scripts/build-blog.mjs`：读取 `content/blog/*.md`，写出 `public/blog-posts.json` 和 `public/rss.xml`。

## 写一篇文章

在 `content/blog/` 新建 Markdown，文件名建议：

```
YYYY-MM-DD-slug.md
```

例如 `2026-08-13-somewhere.md`。构建时会去掉日期前缀，slug 变成 `somewhere`，对应地址 `/blog/somewhere`。

Frontmatter：

```yaml
---
title: "标题"
date: "2026-08-13"
excerpt: "列表页和 RSS 用的摘要"
tags: ["travel", "life"]
mood: "思考"
location: "🇳🇵 加德满都"
---
```

`mood` 和 `location` 可选。正文就是普通 Markdown，图片放 `public/blog-images/`，文里写成：

```markdown
![说明](/blog-images/某个文件夹/img-01.jpg)
```

也可以走后台：本地或线上打开 `/admin`（Decap CMS），用可视化编辑器写。

改完文章后跑一次 `npm run build`，或直接 `npm run dev` 前先执行：

```bash
node scripts/build-blog.mjs
```

开发时站点会读 `public/blog-posts.json`；这个文件不存在时会回退到 `src/data/blog.ts`。

## 改其他内容

这些不走 Markdown，直接改源码：

| 想改什么 | 改哪里 |
| --- | --- |
| 站点标题、域名、RSS | `src/lib/site.ts` |
| 现在在干嘛 | `src/data/now.ts` |
| 友链 | `src/pages/Friends.tsx` |
| 照片墙 | `src/data/photos.ts` |
| 关于我 | `src/pages/About.tsx` |
| 旅行轨迹 | `public/travel-route.json` |

照片现在还是 Unsplash 占位图，换成自己的图改 `src/data/photos.ts` 即可。

## 脚本

都在 `scripts/` 里，一般不用每天碰。

| 脚本 | 做什么 |
| --- | --- |
| `build-blog.mjs` | Markdown → `blog-posts.json` + RSS |
| `generate-rss.mjs` | 给上面那个调用，单独生成 RSS |
| `fetch-portfolio.mjs` | 拉长桥持仓，写入 `public/portfolio.json` |
| `auth-longbridge.mjs` | 长桥 OAuth 登录 |
| `fetch-trades.mjs` / `fetch-h1-trades.mjs` | 拉成交记录（隐私数据，不入库） |
| `generate-h1-report.mjs` | 半年交易小结 |
| `process-tracks.mjs` | GPS CSV → 旅行轨迹 JSON（本地脚本，已 gitignore） |

持仓相关需要长桥环境变量：

```bash
LONGBRIDGE_APP_KEY
LONGBRIDGE_APP_SECRET
LONGBRIDGE_ACCESS_TOKEN
```

成交记录、半年报、原始轨迹 CSV 都视为隐私数据，不会进仓库。

## 部署

推到 `master` 会触发 GitHub Actions：

1. 若配置了长桥 Secrets，先拉一次最新持仓
2. `npm run build`
3. 把 `index.html` 复制成 `404.html`，给 GitHub Pages 做 SPA 回退
4. 发布到 GitHub Pages

工作流：`.github/workflows/deploy.yml`

另外有一个定时任务 `.github/workflows/update-portfolio.yml`，大约每 5 分钟拉一次持仓并回写 `public/portfolio.json`。需要在仓库 Secrets 里配好上面三个长桥变量。

自定义域名写在 `public/CNAME`。

## 目录

```
content/blog/          文章 Markdown
public/                静态资源、CNAME、编译后的文章 JSON / RSS
public/blog-images/    文章配图
public/admin/          Decap CMS
src/pages/             页面
src/components/        组件
src/data/              现在、照片、旅行等数据
src/lib/               站点配置、文章加载
scripts/               构建与数据脚本
.github/workflows/     部署 & 持仓更新
```

## 订阅

RSS：https://yanbowa.ng/rss.xml
