import { Link } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { loadBlogPosts, BlogPost } from "@/lib/blog-loader";
import FadeIn from "@/components/FadeIn";
import PageTransition from "@/components/PageTransition";

export default function BlogList() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    loadBlogPosts().then(setPosts);
  }, []);

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));

  const filtered = posts.filter((post) => {
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    const matchesSearch =
      !search ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <FadeIn>
            <div className="mb-12">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                博客 ✍️
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                写给自己看的，你碰巧路过而已。relax 🧘
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mb-8 space-y-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜搜看..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-warm-200/40 dark:border-gray-800/40 focus:border-forest-400 dark:focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-400/20 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`text-sm px-3 py-1.5 rounded-full transition-all ${
                    !selectedTag
                      ? "bg-forest-600 text-white dark:bg-forest-500"
                      : "bg-warm-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-warm-200 dark:hover:bg-gray-700"
                  }`}
                >
                  全部
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`text-sm px-3 py-1.5 rounded-full transition-all ${
                      selectedTag === tag
                        ? "bg-forest-600 text-white dark:bg-forest-500"
                        : "bg-warm-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-warm-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>

          <div className="grid gap-6">
            {filtered.map((post, i) => (
              <FadeIn key={post.slug} delay={0.05 * i}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="group block p-6 md:p-8 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-warm-200/40 dark:border-gray-800/40 hover:border-warm-300/60 dark:hover:border-gray-700/60 hover:shadow-lg hover:shadow-warm-200/20 dark:hover:shadow-gray-900/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500 mb-3">
                    <span>{post.date}</span>
                    {post.location && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {post.location}
                        </span>
                      </>
                    )}
                    {post.mood && (
                      <>
                        <span>·</span>
                        <span className="font-hand text-lg text-sunset-500">{post.mood}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900 dark:text-gray-100 group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors mb-3">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-0.5 rounded-full bg-warm-50 dark:bg-gray-800 text-warm-600 dark:text-warm-400 border border-warm-200/50 dark:border-gray-700/50"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Link>
              </FadeIn>
            ))}

            {filtered.length === 0 && (
              <FadeIn>
                <div className="text-center py-20 text-gray-400">
                  <p className="text-4xl mb-4">🫠</p>
                  <p className="font-hand text-xl">没找到诶...</p>
                  <p className="text-sm mt-2">换个关键词试试？</p>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
