export interface NowSection {
  emoji: string;
  title: string;
  items: string[];
}

export const nowData = {
  lastUpdated: "2025-05-01",
  location: "🇨🇳 驻马店",
  locationNote: "在路上。",

  sections: [
    {
      emoji: "💻",
      title: "Building",
      items: [
        "WorkWorkOrg — 远程工作者社区，正在做 v0.3，加了实时协作功能",
        "这个博客 — 对就是你现在看到的这个，用 React + Vite 搭的",
      ],
    },
    {
      emoji: "📚",
      title: "Learning",
      items: [
        "韩语 — 目前大概 TOPIK 2 水平，能点菜能问路，吵架还不行",
        "Rust — 想写点高性能的小工具，目前还在跟 borrow checker 较劲",
        "摄影后期 — 在学 DaVinci Resolve，想做旅行 vlog",
      ],
    },
    {
      emoji: "📖",
      title: "Reading",
      items: [
        "《置身事内》— 讲中国政府与经济的，写得真好",
        "《Atomic Habits》— 重读第二遍，这次认真执行了",
      ],
    },
    {
      emoji: "🎮",
      title: "Playing",
      items: [
        "Hades II — 太好玩了，已经50小时了救命",
        "偶尔打打 chess.com，rating 在 1200 左右晃",
      ],
    },
    {
      emoji: "💰",
      title: "Investment",
      items: [
        "继续定投 BTC + ETH，不看盘",
        "关注 AI 方向的早期项目",
        "最近在研究 DePIN 赛道",
      ],
    },
    {
      emoji: "✈️",
      title: "Travel Plans",
      items: [
        "6月想去台湾吃小吃",
        "8月可能回清迈待一阵",
        "年底计划去一趟欧洲",
      ],
    },
  ] as NowSection[],
};
