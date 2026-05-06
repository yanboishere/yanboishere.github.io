import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadBlogPosts, BlogPost as BlogPostType } from "@/lib/blog-loader";
import FadeIn from "@/components/FadeIn";
import PageTransition from "@/components/PageTransition";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [allPosts, setAllPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogPosts().then((p) => {
      setAllPosts(p);
      setLoading(false);
    });
  }, []);

  const post = allPosts.find((p) => p.slug === slug);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-float text-4xl mb-4">✍️</div>
          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🫠</p>
          <h1 className="font-display text-2xl mb-2">这篇文章不存在诶</h1>
          <Link to="/blog" className="text-forest-600 dark:text-forest-400 hover:underline">
            回去看看别的 →
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16">
        <article className="container max-w-3xl mx-auto px-4">
          <FadeIn>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors mb-8"
            >
              <ArrowLeft size={16} /> 返回博客列表
            </Link>
          </FadeIn>

          <FadeIn delay={0.1}>
            <header className="mb-10">
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> {post.date}
                </span>
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
              <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-warm-50 dark:bg-gray-800 text-warm-600 dark:text-warm-400 border border-warm-200/50 dark:border-gray-700/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </header>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="blog-content text-gray-800 dark:text-gray-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
            </div>
          </FadeIn>

          {/* prev/next navigation */}
          <FadeIn delay={0.3}>
            <div className="mt-16 pt-8 border-t border-warm-200/50 dark:border-gray-800/50">
              <div className="grid md:grid-cols-2 gap-4">
                {prevPost && (
                  <Link
                    to={`/blog/${prevPost.slug}`}
                    className="group p-4 rounded-xl hover:bg-warm-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <p className="text-xs text-gray-400 mb-1">← 上一篇</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors">
                      {prevPost.title}
                    </p>
                  </Link>
                )}
                {nextPost && (
                  <Link
                    to={`/blog/${nextPost.slug}`}
                    className="group p-4 rounded-xl hover:bg-warm-50 dark:hover:bg-gray-900 transition-colors text-right md:col-start-2"
                  >
                    <p className="text-xs text-gray-400 mb-1">下一篇 →</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors">
                      {nextPost.title}
                    </p>
                  </Link>
                )}
              </div>
            </div>
          </FadeIn>
        </article>
      </div>
    </PageTransition>
  );
}
