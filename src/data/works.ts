// /works 页面的内容。每一条都能在 GitHub 上找到对应的仓库、提交或 PR。
// star 数和 PR 数统计到 2026-10-11，之后想更新直接改这里。

export type LinkKind = "github" | "site" | "post" | "page" | "pr" | "video";

export interface WorkLink {
  kind: LinkKind;
  label: string;
  href: string; // 以 "/" 开头的是站内链接（post 是文章，page 是站内页面）
}

export interface WorkItem {
  id: string;
  date: string; // 开始的年月，比如 "2023.04"
  title: string;
  context?: string; // 黑客松名称之类
  description: string;
  stars?: number; // 100 以上才显示
  links: WorkLink[];
}

export interface Contribution {
  id: string;
  project: string;
  stars: number; // 上游项目的 star 数
  merged: string;
  description: string;
  links: WorkLink[];
}

// 字符串原样显示，[文字, 链接] 渲染成链接
export type RichText = (string | [string, string])[];

export interface Summit {
  date: string; // 那一周的周一
  label: string;
  note: string;
}

const gh = (path: string, label = "GitHub"): WorkLink => ({
  kind: "github",
  label,
  href: `https://github.com/${path}`,
});

const prs = (repo: string, label: string): WorkLink => ({
  kind: "pr",
  label,
  href: `https://github.com/${repo}/pulls?q=is%3Apr+author%3Ayanboishere`,
});

// 「别人的仓库」不算我自己账号和我建的组织（Web3-Club、WorkWorkLabs 等）
export const stats = {
  ownRepos: 43,
  othersMergedPrs: 97,
  othersMergedRepos: 31,
  asOf: "2026 年 10 月 11 日",
};

// 贡献图上标出来的山峰，按优先级排，挤不下的会被跳过
export const summits: Summit[] = [
  { date: "2023-04-03", label: "ETH Beijing", note: "在打 ETH Beijing 黑客松" },
  { date: "2025-02-03", label: "WorkWork", note: "在整理 WorkWork 的招聘导航和文档" },
  { date: "2023-06-26", label: "Chain Food", note: "在做 ETH Shanghai 的参赛作品 Chain Food" },
  { date: "2026-09-21", label: "Memoh", note: "在给 Memoh 做官网和文档" },
  { date: "2023-10-16", label: "PoS Planet", note: "在打 ETH Hangzhou 黑客松，做 PoS Planet" },
  { date: "2022-12-12", label: "学前端", note: "在写 Web 前端的学习笔记" },
  { date: "2023-02-20", label: "Web3 Wiki", note: "在搭 Web3 Wiki，翻译区块链工程师学习路线" },
];

export const products: WorkItem[] = [
  {
    id: "chaimi",
    date: "2026.10",
    title: "柴米",
    description:
      "手绘风格的家庭食材库存 iOS App。扫购物小票入库，临期和过期会提醒，按库存推荐菜谱，顺手记卡路里。用 SwiftUI + SwiftData 写的，识别小票和联网搜菜谱可以选择接 Claude。",
    links: [gh("yanboishere/chaimi")],
  },
  {
    id: "hl-news-bot",
    date: "2026.10",
    title: "hl-news-bot",
    description:
      "在 Hyperliquid 永续合约上做新闻事件交易的 bot。接金十、财联社的快讯，用规则加可选的 LLM 判断事件和方向，过了风控再按模板开仓。默认只跑模拟盘。",
    links: [gh("yanboishere/hl-news-bot")],
  },
  {
    id: "infini-mcp",
    date: "2026.01",
    title: "Infini 支付 MCP Server",
    description:
      "基于 Infini 支付 API 的 MCP 服务器，让 AI 助手可以创建和查询加密货币收款订单、发起多链提现、校验回调签名。",
    links: [gh("yanboishere/infini-mcp")],
  },
  {
    id: "workwork",
    date: "2024.12",
    title: "WorkWork",
    description:
      "我在做的数字游民和远程工作者社区。社区站有文章、播客和游民地图，用 Vue 3 + Supabase 搭的；下面还有招聘导航、给游民用的稳定币支付 NomadPay 和一个加密支付 MCP。",
    links: [{ kind: "site", label: "work-work.org", href: "https://work-work.org" }, gh("WorkWorkLabs")],
  },
  {
    id: "recruitment",
    date: "2023.03",
    title: "远程和 Web3 招聘导航",
    description:
      "把远程工作和 Web3 行业的招聘平台、频道整理成一份导航，收录了三十来家，后来做成了网站。是我 star 最多的项目。",
    stars: 1100,
    links: [
      gh("WorkWorkLabs/Web3-Recruitment-Platform"),
      { kind: "site", label: "网站", href: "https://platform.work-work.org" },
    ],
  },
];

export const tutorials: WorkItem[] = [
  {
    id: "hello-web3",
    date: "2023.11",
    title: "Hello Web3",
    description:
      "面向新手的 Web3 入门文档，想写成 99% 的人都能看懂的版本。和探姬、浙大链协一起合作，还在慢慢写。",
    links: [gh("Web3-Club/Hello-Web3")],
  },
  {
    id: "hello-hackathon",
    date: "2023.11",
    title: "Hello Hackathon 黑客松入门手册",
    description:
      "写给第一次参加黑客松的人：报名、组队、中期检查到 Demo Day 分别要做什么，不会写代码能不能去。内容来自我 2023 年打过的十几场黑客松。",
    stars: 380,
    links: [gh("Web3-Club/Hello-hackathon")],
  },
  {
    id: "cairo-book",
    date: "2023.04",
    title: "Cairo Book 中文翻译",
    description: "Starknet 合约语言 Cairo 的教程 The Cairo Book 的中文翻译，我发起的，有网页版。",
    links: [
      gh("Web3-Club/Cairo-Book_Chinese"),
      { kind: "site", label: "网页版", href: "https://web3-club.github.io/Cairo-Book_Chinese/" },
    ],
  },
  {
    id: "solidity-by-example",
    date: "2023.03",
    title: "Solidity by Example 中文翻译",
    description:
      "solidity-by-example.org 的中文版。2023 年翻了第一版，2026 年对照英文站 v0.8.26 从头校对了一遍，把缺的篇目补齐，也做了网页版。",
    stars: 174,
    links: [
      gh("Web3-Club/Solidity-by-example_Chinese"),
      { kind: "site", label: "网页版", href: "https://web3-club.github.io/solidity-by-example/" },
    ],
  },
  {
    id: "vyper-by-example",
    date: "2023.03",
    title: "Vyper by Example 中文翻译",
    description: "vyper-by-example.org 的中文版，原作者在英文官网上加了中文版的链接。",
    links: [gh("Web3-Club/vyper-by-example_Chinese")],
  },
  {
    id: "web3-wiki",
    date: "2023.02",
    title: "Web3 Wiki",
    description:
      "想做一个中文的 Web3 百科站，用 MkDocs 搭好了站，写了区块链常识、智能合约、安全等条目的框架。后来域名过期被抢注，项目停在这里，精力转到了 Hello Web3。",
    links: [gh("Web3-Club/Web3wiki-Website")],
  },
  {
    id: "blockchain-roadmap",
    date: "2023.02",
    title: "区块链工程师学习路线（中文版）",
    description:
      "把 roadmap.sh 的 Blockchain Developer 路线从头翻成中文，做了思维导图、PDF、HTML 等几种格式。",
    stars: 256,
    links: [
      gh("Web3-Club/Blockchain-Developer-roadmap_Chinese"),
      { kind: "post", label: "制作小记", href: "/blog/blockchain-developer-roadmap" },
    ],
  },
];

export const tutorialExtras: RichText = [
  "还有一些零碎的资料：",
  ["OKX Python 交易教程翻译", "https://github.com/yanboishere/OKX-Python.Trading.Spot-Tutorial.Article-Chinese"],
  "、",
  ["TON 资料汇总", "https://github.com/Web3-Club/Hello_TON"],
  "、",
  ["Web3 反诈手册", "https://github.com/Web3-Club/anti-Web3-scam"],
  "、",
  ["8 家交易所的上币资料", "https://github.com/yanboishere/CEX-Listing-Package"],
  "。大学时的学习笔记也都公开着：",
  ["Web 前端", "https://github.com/yanboishere/Web-learning"],
  "、",
  ["Go", "https://github.com/yanboishere/Go-learning"],
  "、",
  ["Python", "https://github.com/yanboishere/Python-leaning"],
  "、",
  ["高等数学笔记", "https://github.com/yanboishere/SongHao-Online-Course-of-Advanced-Mathematics-Notes"],
  "和",
  ["课后习题手写答案", "https://github.com/yanboishere/Answers-of-exercises-in-advanced-mathematics-textbooks"],
  "。",
];

export const hackathons: WorkItem[] = [
  {
    id: "nomadpay",
    date: "2025.10",
    title: "NomadPay",
    context: "ETHShanghai 2025",
    description:
      "给数字游民用的稳定币支付和收益工具：用 USDC/USDT 扫当地的收款码付款，闲钱放进 DeFi 池子生息。黑客松期间写了缓冲池合约和演示应用。",
    links: [gh("WorkWorkLabs/NomadPay")],
  },
  {
    id: "nextword",
    date: "2024.07",
    title: "NextWordApp",
    context: "AdventureX 2024",
    description:
      "AI + Web3 的背单词平台：像刷短视频一样看例句视频记单词，学完用当天的词生成短文复习，学习还能攒积分。黑客松里搭了前后端雏形、钱包登录和背后的 AI Agent。",
    links: [gh("NextWordApp/NextWordApp")],
  },
  {
    id: "trable",
    date: "2023.12",
    title: "Trable",
    context: "2023 Polkadot 冬季黑客松",
    description:
      "用加密货币直接买境外旅行产品的支付 DApp，省掉「链上代币→交易所→法币→外币」这一串兑换。我写了方案和文档，调研了 Acala 的跨链资产路由。",
    links: [gh("Web3-Club/Trable")],
  },
  {
    id: "circle-hmac",
    date: "2023.11",
    title: "Circle HMAC-SHA256",
    context: "Circle Hackathon HK 2023",
    description:
      "给 Circle 可编程钱包 API 做的安全加固方案：有些操作只靠请求头里的 API Key 鉴权，我们在请求上再加一层 HMAC-SHA256 签名。",
    links: [gh("Web3-Club/Circle-HMAC-SHA256")],
  },
  {
    id: "pos-planet",
    date: "2023.10",
    title: "PoS Planet",
    context: "ETH Hangzhou 2023、ETH HongKong 2023",
    description:
      "基于 Starknet Dojo 的全链游戏。设定是 3023 年地球被 PoW 挖空了，DAO 带着种子移民到新星球，用 PoS 的规则开荒种地。",
    links: [gh("Web3-Club/PoS-Planet")],
  },
  {
    id: "pintravel",
    date: "2023.08",
    title: "PinTravel",
    context: "2023 上海国际黑客松周（山海坞分会场）",
    description:
      "DePIN + 文旅：游客在景区拍照打卡，生成带位置的链上 SBT，拼成一张景点地图，也帮缺宣传预算的小景区攒下照片。",
    links: [gh("yanboishere/PinTravel")],
  },
  {
    id: "chain-food",
    date: "2023.06",
    title: "Chain Food",
    context: "ETH Shanghai 2023",
    description:
      "减少食物浪费的公益 DApp，把附近快过期、本来要扔掉的食物免费分给需要的人。灵感来自黑客松现场早上剩下的一堆早餐，和便利店里第二天就要扔掉的打折食品。",
    links: [gh("yanboishere/Chain.Food")],
  },
  {
    id: "web3-interactive-learning",
    date: "2023.04",
    title: "Web3 Interactive Learning",
    context: "ETH Beijing 2023",
    description:
      "聊天式的 Web3 学习平台，按学习者的回答走不同的学习路线，学完自动发课程 NFT。我是队长，写文档、设计对话逻辑，熬了一个通宵往 JSON 里填聊天内容。",
    links: [
      gh("Web3-Club/Web3-Interactive-Learning"),
      { kind: "post", label: "活动记", href: "/blog/eth-beijing-web3-75" },
    ],
  },
];

export const sideWorks: WorkItem[] = [
  {
    id: "flood-relief-nepal",
    date: "2026.09",
    title: "尼泊尔洪灾救济站中文版",
    description: "给 floodreliefnepal.com 做了简体中文版，按国内用户的习惯补上了支付宝捐款的说明。",
    links: [
      { kind: "site", label: "中文版", href: "https://floodreliefnepal.com/zh/" },
      { kind: "pr", label: "PR #8", href: "https://github.com/web3Gurung/floodreliefnepal/pull/8" },
    ],
  },
  {
    id: "qwerty-dicts",
    date: "2026.08",
    title: "qwerty-learner 多语种词库",
    description:
      "给打字背单词软件 qwerty-learner 加了波兰语、《延世韩国语》1—6 册、《新视线》意大利语 A1—A2、西班牙语高频 5000 词四套词库，释义都校对过。原仓库维护停滞了，放在我的 fork 里。",
    links: [gh("yanboishere/qwerty-learner")],
  },
  {
    id: "this-blog",
    date: "2025.11",
    title: "这个博客",
    description: "就是你正在看的 yanbowa.ng，React + Vite 写的。足迹页用 40 多万个 GPS 点回放我走过的路。",
    links: [gh("yanboishere/yanboishere.github.io"), { kind: "page", label: "足迹", href: "/footprints" }],
  },
  {
    id: "supertrend",
    date: "2023.06",
    title: "SuperTrend 交易脚本",
    description:
      "调 OKX API 盯 SuperTrend 指标的翻转信号，在 BTC 永续合约上做多做空，带止损止盈和低波动过滤。个人实验，没经过长期验证。",
    links: [gh("yanboishere/Trade.with-SuperTrend.parameter")],
  },
];

// 工作过的团队：只写 GitHub 上能找到的部分
export const jobs: WorkItem[] = [
  {
    id: "uxuy",
    date: "2024.10",
    title: "UXUY",
    context: "开发者生态 BD / DevRel",
    description:
      "UXUY Wallet 是 Telegram 上的多链钱包，UXUY Connect 能把 DApp 变成 Telegram 小程序。我给 UXUY Connect 搭了入门教程仓库，录了一期视频《如何将 Dapp 转为 Telegram Mini App 的最简单方案》，写了配套的示例 DApp，在官方文档里补了 Flow 链的支持信息和自定义链的说明，还整理了组织主页上已接入的 DApp 列表。",
    links: [
      { kind: "video", label: "教程视频", href: "https://www.bilibili.com/video/BV13e1xY1E6d" },
      gh("uxuyconnect/Dapp-Demo", "示例 DApp"),
      prs("uxuycom/uxuy-docsite", "文档的 PR"),
    ],
  },
  {
    id: "bitlayer",
    date: "2024.03",
    title: "Bitlayer",
    context: "DevRel",
    description:
      "Bitlayer 是基于 BitVM 的比特币 Layer 2。主网上线前，我们在 GitHub 上搭了一版开发者文档的草稿：文档站是探姬建的，我写了技术架构、路线图和应用场景的介绍，测试网的 Chain ID、RPC、浏览器、水龙头和钱包连接教程，以及部署章节的目录。",
    links: [gh("Web3-Jerry/bitlayer", "文档仓库")],
  },
  {
    id: "donate3",
    date: "2023.10",
    title: "Donate3（LXDAO）",
    context: "公共物品",
    description:
      "LXDAO 做的 Web3 捐赠工具，公共物品和创作者五分钟就能接上加密货币捐赠。我在 GitHub 上留下的主要是 SDK 和官网仓库的 README 和项目介绍，产品代码主要是其他成员写的。",
    links: [gh("lxdao-official/donate3-sdk", "SDK")],
  },
];

export const contributions: Contribution[] = [
  {
    id: "developer-roadmap",
    project: "developer-roadmap（roadmap.sh）",
    stars: 369107,
    merged: "合并 1 个 PR，2024 年 11 月",
    description: "补写了 DevRel 路线里 LinkedIn 这一节。它的区块链工程师路线我也翻成过中文。",
    links: [{ kind: "pr", label: "PR #7695", href: "https://github.com/nilbuild/developer-roadmap/pull/7695" }],
  },
  {
    id: "oi-wiki",
    project: "OI Wiki",
    stars: 26839,
    merged: "合并 10 个 PR，2022 年 11—12 月",
    description:
      "补充了 CLion 用教育邮箱申请免费许可证的说明、写第一个程序时的注意事项、自主招生改为强基计划的背景、坐标系里零角的知识点，也修了几处信息和格式。",
    links: [prs("OI-wiki/OI-wiki", "我的 PR")],
  },
  {
    id: "lxgw",
    project: "霞鹜文楷（和霞鹜新晰黑）",
    stars: 26219,
    merged: "合并 7 个 PR，2023 年 1 月",
    description:
      "给文楷补了 OFL 协议里不能单独售卖字体文件的说明，以及 Windows 上用 Scoop 安装的方法；给新晰黑把国标写法统一成 GB/T 2312-1980、GB/T 12345-1990，并附上标准原文链接。这个博客的正文用的就是霞鹜文楷。",
    links: [prs("lxgw/LxgwWenKai", "文楷的 PR"), prs("lxgw/LxgwNeoXiHei", "新晰黑的 PR")],
  },
  {
    id: "smiley-sans",
    project: "得意黑 Smiley Sans",
    stars: 14901,
    merged: "合并 5 个 PR，2022 年 12 月—2023 年 1 月",
    description:
      "在 README 里补了 Windows 安装字体的说明，改了几处用词，把 GB 2312 的写法规范成 GB/T 2312-1980 并附上标准链接。这一页的数字用的就是得意黑。",
    links: [prs("atelier-anchor/smiley-sans", "我的 PR")],
  },
  {
    id: "wtf-academy",
    project: "WTF Academy 教程",
    stars: 14060,
    merged: "合并 14 个 PR，2023 年 6 月—2024 年 2 月",
    description:
      "在 WTF JavaScript 里把运算符和常用方法整理成表格，补了编辑器推荐和打开浏览器开发者工具的快捷键；在 WTF Solidity、WTF Vyper 的 README 里加上 Solidity / Vyper by Example 中文版的链接，顺手改过 WTF gm 和 WTF Scroll。",
    links: [
      prs("WTFAcademy/WTF-JavaScript", "WTF JavaScript 的 PR"),
      { kind: "pr", label: "WTF Solidity #513", href: "https://github.com/AmazingAng/WTF-Solidity/pull/513" },
    ],
  },
  {
    id: "memoh",
    project: "Memoh（文档和官网）",
    stars: 2666,
    merged: "合并 10 个 PR，2026 年 9—10 月",
    description:
      "开源的多智能体平台。我写了官方文档的快速开始和入门教程，给官网做了中英文发布博客、日语版和帮助中心页面，还做了一套品牌宣传图。",
    links: [
      { kind: "site", label: "docs.memoh.ai", href: "https://docs.memoh.ai" },
      prs("felinics/memoh-docs", "文档的 PR"),
      prs("felinics/landing", "官网的 PR"),
      gh("yanboishere/memoh-brand-assets", "品牌图"),
    ],
  },
];

export const contributionExtras: RichText = [
  "还有些小修小补：给 ",
  ["OpenZeppelin Contracts", "https://github.com/OpenZeppelin/openzeppelin-contracts/issues/4375"],
  " 报过 README 里的失效链接（已修复），向 ",
  ["skill-icons", "https://github.com/tandpfun/skill-icons/issues/213"],
  " 提议加了 CLion 和 PyCharm 图标，给 ",
  ["中文拼音代码补全插件", "https://github.com/tuchg/ChinesePinyin-CodeCompletionHelper/pull/72"],
  "和 ",
  ["iBeats", "https://github.com/yihong0618/iBeats/pull/31"],
  " 改过 README，给 ",
  ["yu-tools", "https://github.com/pseudoyu/yu-tools/pull/5"],
  " 更新过交易所 App 的名字，给 ",
  ["Quantum Wormhole", "https://github.com/AdhesionTek/Quantum-Wormhole/pull/34"],
  " 加了日文 README。",
];

export const communities: WorkItem[] = [
  {
    id: "jluba",
    date: "2023.04",
    title: "吉林高校区块链联盟（JLUBA）",
    description: "2023 年 4 月在吉林省的高校之间发起的线上区块链社区，想让更多在校大学生接触区块链。",
    links: [gh("JiLin-Universities-Blockchain-Alliance")],
  },
  {
    id: "web3-club",
    date: "2023.02",
    title: "Web3-Club",
    description:
      "2023 年 2 月建的中文 Web3 开源社区。上面那些翻译、教程和不少黑客松作品都放在这里，现在有 31 个公开仓库。",
    links: [gh("Web3-Club")],
  },
];
