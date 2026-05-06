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

我在清迈的咖啡馆写代码，旁边坐着一个也在写代码的德国人。我们对视了一眼，然后各自戴上了耳机。

这就是远程工作者的日常——**明明在同一个空间，却像在不同的星球。**

## 灵感

2024年在巴厘岛，我参加了一个 co-working space 的活动。那天下午，我认识了5个不同国家的开发者，我们一起debug一个bug，一起吃晚饭，一起吐槽甲方。

那种感觉——**哇啊啊啊 太棒了。**

回去之后我就想：为什么这种connection不能更频繁、更自然？

## WorkWorkOrg

所以我开始做 WorkWorkOrg。

它不是一个社交平台，不是一个招聘网站，也不是一个项目管理工具。

它是一个——**让远程工作者找到彼此、一起工作、一起成长的地方。**

## 现在

还在 very early stage。我在首尔的公寓里，每天写代码到凌晨2点。

有时候会怀疑自己：这玩意儿真的有人用吗？
然后打开 Twitter 看到有人@我说"加油"，就又来劲了。

**Building is hard. But it's also the most fun thing I've ever done.**

---

*如果你也是远程工作者，来玩啊 → workworkorg.com*
`,
  },
];
