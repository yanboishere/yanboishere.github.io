import { Link } from "react-router-dom";
import type { BlogPost } from "@/lib/blog-loader";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import RssSubscribeButton from "@/components/RssSubscribeButton";
import { cn } from "@/lib/utils";

const TAG_LABELS: Record<string, string> = {
  travel: "旅行",
  tech: "技术",
  web3: "Web3",
  career: "职业",
  crypto: "加密",
  conference: "活动",
  "central-asia": "中亚",
  uzbekistan: "乌兹别克斯坦",
  kazakhstan: "哈萨克斯坦",
  "digital-nomad": "数字游民",
};

function getCategoryLabel(post: BlogPost): string {
  const tag = post.tags[0];
  if (!tag) return "文章";
  const label = TAG_LABELS[tag] ?? tag;
  return `文章 · ${label}`;
}

interface RecentWritingProps {
  posts: BlogPost[];
  limit?: number;
}

export default function RecentWriting({ posts, limit = 5 }: RecentWritingProps) {
  const items = posts.slice(0, limit);

  return (
    <section>
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-gray-400 dark:text-gray-500 mb-2">
            Recent Writing
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            近期笔墨
          </h2>
        </div>
        <RssSubscribeButton />
      </div>

      <div className="space-y-0">
        {items.map((post, index) => {
          const num = String(index + 1).padStart(2, "0");
          const relativeTime = formatRelativeTime(post.date);
          const isFirst = index === 0;
          const category = getCategoryLabel(post);

          return (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group grid grid-cols-[3rem_1fr] md:grid-cols-[4rem_1fr] gap-x-4 md:gap-x-6 py-6 border-b border-gray-200/60 dark:border-gray-800/60 last:border-b-0"
            >
              <div className="pt-1">
                <span className="text-sm text-gray-400 dark:text-gray-500 font-mono tabular-nums">
                  {num}
                </span>
              </div>

              <div
                className={cn(
                  "relative pl-5 border-l-2 transition-colors",
                  isFirst
                    ? "border-rose-400 dark:border-rose-400"
                    : "border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600"
                )}
              >
                {isFirst ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
                    文章 · {relativeTime}
                  </p>
                ) : null}

                <h3
                  className={cn(
                    "font-display font-bold text-gray-900 dark:text-gray-100 leading-snug transition-colors group-hover:text-forest-600 dark:group-hover:text-forest-400",
                    isFirst ? "text-xl md:text-2xl mb-0" : "text-lg md:text-xl mb-2"
                  )}
                >
                  {post.title}
                </h3>

                {!isFirst && (
                  <div className="flex items-center justify-between gap-4 mt-1">
                    <p className="text-sm text-gray-400 dark:text-gray-500">{category}</p>
                    <span className="text-sm text-gray-400 dark:text-gray-500 shrink-0">
                      {relativeTime}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}