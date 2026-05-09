import FadeIn from "@/components/FadeIn";
import PageTransition from "@/components/PageTransition";

const timeline = [
  { year: "2019" },
  { year: "2020" },
  { year: "2021" },
  { year: "2022" },
  { year: "2023" },
  { year: "2024" },
  { year: "2025" },
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
                    src="/logo.png"
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
                    嘿，我是烟波。一个从大学休学的普通人，走过20个国家，还在路上。
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                    现在的身份：数字游民 / 独立开发者 / 不太专业的旅行摄影师 / <a href="https://work-work.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-forest-500">work-work.org</a>。
                  </p>
                </div>
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
                      <span className="font-mono text-sm text-forest-600 dark:text-forest-400">{item.year}</span>
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
              </ul>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
