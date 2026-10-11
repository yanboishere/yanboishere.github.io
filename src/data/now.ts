export interface NowSection {
  emoji: string;
  title: string;
  items: string[];
}

export const nowData = {
  lastUpdated: "2026-10-11",
  location: "🇨🇳深圳，中国",
  locationNote: "在尼泊尔旅居，学雅思，健身",

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
