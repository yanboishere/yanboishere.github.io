export interface NowSection {
  emoji: string;
  title: string;
  items: string[];
}

export const nowData = {
  lastUpdated: "2025-05-01",
  location: "🇨🇳 驻马店，河南",
  locationNote: "在朋友家做沙发客和看家",

  sections: [
    {
      emoji: "💻",
      title: "Building",
      items: [
        "WorkWork — 远程工作者社区",
      ],
    },
    {
      emoji: "📚",
      title: "Learning",
      items: [
        "学英语，冲雅思7",
      ],
    },
    {
      emoji: "🎮",
      title: "Playing",
      items: [
        "电子阳痿",
      ],
    },
  ] as NowSection[],
};
