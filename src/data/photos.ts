export interface Photo {
  id: string;
  src: string;
  alt: string;
  location: string;
  story?: string;
  date: string;
  aspect: "portrait" | "landscape" | "square";
}

// 哈哈 用 Unsplash 的 placeholder 图片，后面换成自己的作品
export const photos: Photo[] = [
  {
    id: "chiangmai-cafe",
    src: "https://images.unsplash.com/photo-1525193612562-0ec53b0e5d7c?w=800&q=80",
    alt: "清迈咖啡馆的午后",
    location: "🇹🇭 清迈",
    story: "这是我最常去的咖啡馆，老板已经认识我了。每次点一样的dirty，然后打开电脑开始一天的工作。",
    date: "2024-03",
    aspect: "landscape",
  },
  {
    id: "lisbon-tram",
    src: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80",
    alt: "里斯本的老电车",
    location: "🇵🇹 里斯本",
    story: "28路电车经过 Alfama 区的那一刻，阳光刚好照进窗户。抓拍。",
    date: "2024-05",
    aspect: "portrait",
  },
  {
    id: "seoul-night",
    src: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&q=80",
    alt: "首尔的霓虹",
    location: "🇰🇷 首尔",
    story: "弘大街头，凌晨1点还在外面逛。首尔的夜太好拍了。",
    date: "2024-08",
    aspect: "portrait",
  },
  {
    id: "bali-sunset",
    src: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    alt: "巴厘岛的日落",
    location: "🇮🇩 巴厘岛",
    story: "在 Canggu 的海滩上，看了一场这辈子最好的日落。旁边有人在冲浪，有人在弹吉他。",
    date: "2024-07",
    aspect: "landscape",
  },
  {
    id: "tokyo-rain",
    src: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80",
    alt: "东京的雨天",
    location: "🇯🇵 东京",
    story: "中目黑的雨天，路边的自动贩卖机发着暖光。等雨停的时候顺手拍的。",
    date: "2025-02",
    aspect: "portrait",
  },
  {
    id: "digital-nomad-work",
    src: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80",
    alt: "在路上工作",
    location: "✈️ somewhere",
    story: "这就是数字游民的日常——在任何有WiFi的地方打开电脑。",
    date: "2024-09",
    aspect: "landscape",
  },
  {
    id: "kyoto-temple",
    src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    alt: "京都的寺庙",
    location: "🇯🇵 京都",
    story: "岚山竹林，早上6点去的，没什么人。安静到能听见自己的心跳。",
    date: "2025-02",
    aspect: "portrait",
  },
  {
    id: "bangkok-street",
    src: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80",
    alt: "曼谷街头",
    location: "🇹🇭 曼谷",
    story: "考山路的烟火气。路边摊的炒粉 + 泰式奶茶 = 人间天堂。",
    date: "2024-04",
    aspect: "landscape",
  },
  {
    id: "coffee-code",
    src: "https://images.unsplash.com/photo-1461988320302-91bde64fc8e4?w=800&q=80",
    alt: "咖啡和代码",
    location: "☕ everywhere",
    story: "每一行代码都伴随着一杯咖啡。这是我的工作仪式感。",
    date: "2024-11",
    aspect: "square",
  },
];

export const journeys = [
  {
    country: "🇹🇭 泰国",
    cities: ["清迈", "曼谷", "普吉"],
    highlight: "数字游民的圣地，待了最久",
  },
  {
    country: "🇮🇩 印尼",
    cities: ["巴厘岛", "日惹"],
    highlight: "Canggu的冲浪和咖啡",
  },
  {
    country: "🇵🇹 葡萄牙",
    cities: ["里斯本", "波尔图"],
    highlight: "蛋挞和老电车",
  },
  {
    country: "🇰🇷 韩国",
    cities: ["首尔", "釜山"],
    highlight: "凌晨的弘大街头",
  },
  {
    country: "🇯🇵 日本",
    cities: ["东京", "京都", "大阪"],
    highlight: "一切都很精致",
  },
  {
    country: "🇲🇾 马来西亚",
    cities: ["吉隆坡", "槟城"],
    highlight: "炒粿条太好吃了",
  },
  {
    country: "🇻🇳 越南",
    cities: ["胡志明", "河内"],
    highlight: "滴漏咖啡和摩托车大军",
  },
  {
    country: "🇪🇸 西班牙",
    cities: ["巴塞罗那", "马德里"],
    highlight: "高迪的建筑让人哇啊啊啊",
  },
];
