import FadeIn from "@/components/FadeIn";
import PageTransition from "@/components/PageTransition";

const timeline = [
  {
    year: "2019",
    title: "退学了 🫠",
    desc: "想清楚了，不想用四年换一张纸。退学后第一天睡到自然醒，打开电脑写代码——爽！！！",
  },
  {
    year: "2020",
    title: "开始远程工作",
    desc: "找到了第一份 remote DevRel 工作。开始边旅行边工作的日子。",
  },
  {
    year: "2021",
    title: "东南亚流浪",
    desc: "清迈、巴厘岛、曼谷...数字游民的经典路线。在清迈一待就是三个月。",
  },
  {
    year: "2022",
    title: "被海关滞留 😅",
    desc: "在某个国家因为签证问题被海关拦了。在小黑屋待了4个小时，最后放行了。这段经历以后单独写。",
  },
  {
    year: "2023",
    title: "欧洲之旅",
    desc: "里斯本、巴塞罗那、柏林...在里斯本的老电车上用手机写了三个 commit。",
  },
  {
    year: "2024",
    title: "开始 Build WorkWorkOrg 🚀",
    desc: "不想再给别人打工了。开始做自己的产品——一个让远程工作者不再孤独的社区。",
  },
  {
    year: "2025",
    title: "搬到首尔",
    desc: "韩国的网速、咖啡馆和炸鸡太有吸引力了。现在在合井附近的小公寓里写代码。",
  },
];

export default function About() {
  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container max-w-3xl mx-auto px-4">
          <FadeIn>
            <div className="mb-12">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                关于我 🫠
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                一个很真实的、不端着的自我介绍。
              </p>
            </div>
          </FadeIn>

          {/* intro */}
          <FadeIn delay={0.1}>
            <div className="p-6 md:p-8 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-warm-200/40 dark:border-gray-800/40 mb-12">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden film-border flex-shrink-0 mx-auto md:mx-0">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
                    alt="烟波"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1" translate="no">
                    烟波 Yanbo
                    </h2>
                  <p className="text-forest-600 dark:text-forest-400 font-mono text-sm mb-4">@yanbo2004</p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    嘿，我是烟波。一个从大学退学的普通人，在东南亚的咖啡馆里学会了写代码，
                    在欧洲的青旅里学会了摄影，在各国的街头学会了好好吃饭。
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                    现在的身份：数字游民 / 独立开发者 / 不太专业的旅行摄影师 / 正在 building @WorkWorkOrg。
                    走过20个国家，还在路上。
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* story sections */}
          <FadeIn delay={0.15}>
            <div className="space-y-8 mb-16">
              <div className="p-6 rounded-2xl bg-sunset-50/50 dark:bg-gray-900/40 border border-sunset-200/30 dark:border-gray-800/30">
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  🫠 为什么退学
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  不是叛逆，是想明白了。当我发现课堂上教的东西，YouTube 和文档讲得更好的时候，
                  我觉得与其花时间坐在教室里刷手机，不如直接去做想做的事。
                  退学不是终点，是另一种起点。
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-forest-50/50 dark:bg-gray-900/40 border border-forest-200/30 dark:border-gray-800/30">
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  ✈️ 数字游民日常
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  很多人以为数字游民的生活很 glamorous。其实大部分时间我就是在不同的咖啡馆写不同的代码。
                  偶尔会去海边走走，偶尔会因为签证问题焦虑。
                  但总体来说——relax，我选的生活，我享受。
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-warm-50/50 dark:bg-gray-900/40 border border-warm-200/30 dark:border-gray-800/30">
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  💸 投资那些事
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  作为一个散户，我经历了追涨杀跌、FOMO、亏钱、然后学乖的全过程。
                  现在的策略很简单：定投为主，不折腾，睡得着觉。
                  投资教训写在了博客里，血泪换来的。🥹
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-forest-50/50 dark:bg-gray-900/40 border border-forest-200/30 dark:border-gray-800/30">
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  🚀 为什么做 WorkWorkOrg
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  在巴厘岛参加了一次 co-working 活动后，我意识到远程工作者最缺的不是工具，
                  是 connection。WorkWorkOrg 想解决的就是这个问题——让散落在世界各地的人，
                  能找到彼此，一起工作，一起成长。
                </p>
              </div>
            </div>
          </FadeIn>

          {/* timeline */}
          <FadeIn delay={0.2}>
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              时间线 ⏳
            </h2>
            <div className="relative">
              <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-warm-200 dark:bg-gray-800" />
              <div className="space-y-8">
                {timeline.map((item, i) => (
                  <FadeIn key={item.year} delay={0.05 * i}>
                    <div className="relative pl-12 md:pl-16">
                      <div className="absolute left-2.5 md:left-4.5 top-1 w-3 h-3 rounded-full bg-forest-500 dark:bg-forest-400 border-2 border-cream dark:border-gray-950" />
                      <div>
                        <span className="font-mono text-sm text-forest-600 dark:text-forest-400">{item.year}</span>
                        <h3 className="font-display text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* fun facts */}
          <FadeIn delay={0.25}>
            <div className="mt-16 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-warm-50 to-forest-50/30 dark:from-gray-900 dark:to-gray-900/50 border border-warm-200/40 dark:border-gray-800/40">
              <h2 className="font-hand text-xl text-coffee dark:text-warm-300 mb-4">一些 random facts 🎲</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>☕ 咖啡因依赖者，一天至少两杯，不然写不出代码</li>
                <li>📷 拍照比写代码更让我开心（但写代码比拍照更赚钱）</li>
                <li>🎮 游戏时间基本都给了 Hades 和 chess.com</li>
                <li>🇰🇷 现在在学韩语，目标是能用韩语点炸鸡外卖</li>
                <li>✈️ 最喜欢的国家：每一个都去过的地方</li>
                <li>🫠 最讨厌的事：在机场排队</li>
                <li>💡 信仰：Build in public, live in the moment</li>
              </ul>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
