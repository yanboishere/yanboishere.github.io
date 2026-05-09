export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  mood?: string;
  location?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "building-workwork",
    title: "为什么我要做 WorkWorkOrg 🚀（示例文章）",
    date: "2025-01-08",
    excerpt:
      "每个独立开发者都有一个改变世界的梦。我的梦不大，就是想让远程工作者别那么孤独。",
    tags: ["building", "startup", "WorkWorkOrg"],
    mood: "爽！！！",
    location: "🇰🇷 首尔",
    content: `# 为什么我要做 WorkWorkOrg 🚀

每个独立开发者都有一个改变世界的梦。我的梦不大，就是想让远程工作者别那么孤独。

## 问题

这世界上有很多数字游民，很多人直到我们见过才知道，原来我们有这么多共同点，有这么多旅居史的烦恼。曾经有一段时间的旅行很重合，但是并没有能碰到和认识彼此的机会和渠道。

## 灵感

2024年在清迈，我参加了一个 co-working space 的活动。那天下午，我认识了5个不同国家的开发者，我们一起debug一个bug，一起吃晚饭，一起吐槽甲方。

那种感觉——**哇啊啊啊 太棒了。**

回去之后我就想：为什么这种connection不能更频繁、更自然？

## WorkWorkOrg

所以我开始做 WorkWorkOrg。

它不是一个社交平台，不是一个招聘网站，也不是一个项目管理工具。

它是一个——**让远程工作者找到彼此、一起工作、一起成长的地方。**

**Building is hard. But it's also the most fun thing I've ever done.**

---

*如果你也是远程工作者，来玩啊 → work-work.org*
`,
  },
];
