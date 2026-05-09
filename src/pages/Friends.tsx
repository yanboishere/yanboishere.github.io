import { ExternalLink } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import PageTransition from "@/components/PageTransition";

const friends = [
  { name: "stv.pm", url: "https://blog.luoling.moe/" },
  { name: "seimo.cn", url: "https://seimo.cn" },
  { name: "skywt.net", url: "http://skywt.net" },
  { name: "men.ci", url: "https://men.ci" },
];

export default function Friends() {
  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container max-w-3xl mx-auto px-4">
          <FadeIn>
            <div className="mb-12">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                友链 🥰
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                互联网上的朋友们，互相串个门。
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-4">
            {friends.map((friend, i) => (
              <FadeIn key={friend.name} delay={0.05 * i}>
                <a
                  href={friend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-5 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-warm-200/40 dark:border-gray-800/40 hover:border-warm-300/60 dark:hover:border-gray-700/60 hover:shadow-lg hover:shadow-warm-200/20 dark:hover:shadow-gray-900/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-forest-100 dark:bg-forest-900/30 flex items-center justify-center text-forest-600 dark:text-forest-400 font-display font-bold text-sm">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-gray-900 dark:text-gray-100 group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors">
                        {friend.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {friend.url}
                      </p>
                    </div>
                  </div>
                  <ExternalLink size={18} className="text-gray-400 group-hover:text-forest-500 transition-colors" />
                </a>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
