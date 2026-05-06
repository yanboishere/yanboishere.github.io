import { Calendar, MapPin } from "lucide-react";
import { nowData } from "@/data/now";
import FadeIn from "@/components/FadeIn";
import PageTransition from "@/components/PageTransition";

export default function Now() {
  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container max-w-3xl mx-auto px-4">
          <FadeIn>
            <div className="mb-12">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                现在 📍
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                我现在在干嘛。这个页面会经常更新。
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {nowData.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> 最后更新: {nowData.lastUpdated}
                </span>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="p-6 rounded-2xl bg-warm-50/50 dark:bg-gray-900/40 border border-warm-200/30 dark:border-gray-800/30 mb-8">
              <p className="font-hand text-lg text-coffee dark:text-warm-300">
                "{nowData.locationNote}"
              </p>
            </div>
          </FadeIn>

          <div className="space-y-6">
            {nowData.sections.map((section, i) => (
              <FadeIn key={section.title} delay={0.1 + i * 0.05}>
                <div className="p-6 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-warm-200/40 dark:border-gray-800/40">
                  <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {section.emoji} {section.title}
                  </h2>
                  <ul className="space-y-2">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-warm-400 mt-1.5 text-xs">●</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <div className="mt-12 text-center">
              <p className="text-gray-400 dark:text-gray-600 text-sm">
                Inspired by{" "}
                <a
                  href="https://nownownow.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-forest-600 dark:text-forest-400 hover:underline"
                >
                  nownownow.com
                </a>
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
