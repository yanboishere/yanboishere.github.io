import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { blogPosts } from "@/data/blog";
import { photos } from "@/data/photos";
import FadeIn from "@/components/FadeIn";
import TravelMap from "@/components/TravelMap";

const greetings = [
  "啊！！！你来啦 🎉",
  "relax, 随便逛逛 🧘",
  "Welcome to my backpack 🎒",
  "哇啊啊啊 终于有人来了",
];

export default function Home() {
  const [greeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);
  const [displayedGreeting, setDisplayedGreeting] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayedGreeting("");
    const interval = setInterval(() => {
      i++;
      setDisplayedGreeting(greeting.slice(0, i));
      if (i >= greeting.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, [greeting]);
  const latestPosts = blogPosts.slice(0, 3);
  const featuredPhotos = photos.slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* hero section — 我想要这个区域很大气但又很 relax */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-warm-100/60 via-cream to-cream dark:from-gray-900/60 dark:via-gray-950 dark:to-gray-950" />
        <div className="absolute inset-0 opacity-20 dark:opacity-10">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80"
            alt="mountains"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative container max-w-4xl mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-36">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <p className="font-hand text-2xl md:text-3xl text-sunset-500 dark:text-sunset-400 mb-6 min-h-[2.4em]">
              {displayedGreeting}
              <span className="inline-block w-[2px] h-[1.1em] bg-sunset-400 dark:bg-sunset-500 ml-0.5 align-middle animate-pulse" />
            </p>

            <h1 className="font-display text-5xl md:text-7xl font-bold text-gray-900 dark:text-gray-50 mb-4" translate="no">
              {"烟波"}
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-light mb-2">
              Yanbo
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-sm md:text-base text-gray-600 dark:text-gray-400 my-8">
              <span className="px-3 py-1 rounded-full bg-warm-100 dark:bg-gray-800 border border-warm-200/50 dark:border-gray-700/50">
                Drop out 🫠
              </span>
              <span className="hidden md:inline text-warm-300">|</span>
              <span className="px-3 py-1 rounded-full bg-warm-100 dark:bg-gray-800 border border-warm-200/50 dark:border-gray-700/50">
                Digital Nomad & Writer & Photographer
              </span>
              <span className="hidden md:inline text-warm-300">|</span>
              <span className="px-3 py-1 rounded-full bg-warm-100 dark:bg-gray-800 border border-warm-200/50 dark:border-gray-700/50">
                🎒 Backpacking 20 countries
              </span>
              <span className="hidden md:inline text-warm-300">|</span>
              <span className="px-3 py-1 rounded-full bg-forest-50 dark:bg-forest-900/30 border border-forest-200/50 dark:border-forest-800/50 text-forest-700 dark:text-forest-400">
                Building @WorkWorkOrg 🚀
              </span>
            </div>

            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed mb-10">
              在路上写代码、拍照、记录生活。这个小站是我的数字背包，
              <br className="hidden md:block" />
              装着走过的路、写过的字和一些不成熟的想法。
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link
                to="/blog"
                className="hand-btn bg-forest-600 text-white dark:bg-forest-500 hover:bg-forest-700 dark:hover:bg-forest-600"
              >
                看看我写了啥 ✍️
              </Link>
              <Link
                to="/about"
                className="hand-btn text-coffee dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-gray-800"
              >
                了解更多 🫠
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* latest blog posts */}
      <section className="container max-w-4xl mx-auto px-4 py-16">
        <FadeIn>
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              最近写了点啥 ✍️
            </h2>
            <Link
              to="/blog"
              className="text-sm text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 flex items-center gap-1 transition-colors"
            >
              全部 <ArrowRight size={16} />
            </Link>
          </div>
        </FadeIn>

        <div className="grid gap-6">
          {latestPosts.map((post, i) => (
            <FadeIn key={post.slug} delay={i * 0.1}>
              <Link
                to={`/blog/${post.slug}`}
                className="group block p-6 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-warm-200/40 dark:border-gray-800/40 hover:border-warm-300/60 dark:hover:border-gray-700/60 hover:shadow-lg hover:shadow-warm-200/20 dark:hover:shadow-gray-900/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500 mb-2">
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
                      <span className="font-hand text-sunset-500">{post.mood}</span>
                    </>
                  )}
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 group-hover:text-forest-600 dark:group-hover:text-forest-400 transition-colors mb-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{post.excerpt}</p>
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
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* travel route map */}
      <section className="container max-w-4xl mx-auto px-4 py-16">
        <FadeIn>
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              我的轨迹 🌍
            </h2>
            <Link
              to="/photos"
              className="text-sm text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 flex items-center gap-1 transition-colors"
            >
              旅行照片 <ArrowRight size={16} />
            </Link>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 -mt-4">
            来自 40 万+ 个 GPS 数据点的真实轨迹。走过 20 个国家，每一条线都是一段故事。
          </p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <TravelMap />
        </FadeIn>
      </section>

      {/* featured photos */}
      <section className="container max-w-4xl mx-auto px-4 py-16">
        <FadeIn>
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              随手拍 📷
            </h2>
            <Link
              to="/photos"
              className="text-sm text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 flex items-center gap-1 transition-colors"
            >
              看更多 <ArrowRight size={16} />
            </Link>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {featuredPhotos.map((photo, i) => (
            <FadeIn key={photo.id} delay={i * 0.1}>
              <Link to="/photos" className="group relative aspect-square overflow-hidden rounded-xl film-border cursor-pointer block">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm font-medium">{photo.alt}</p>
                    <p className="text-white/70 text-xs mt-0.5">{photo.location}</p>
                  </div>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* currently / now 摘要 */}
      <section className="container max-w-4xl mx-auto px-4 py-16">
        <FadeIn>
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-warm-50 to-warm-100/50 dark:from-gray-900 dark:to-gray-900/50 border border-warm-200/40 dark:border-gray-800/40">
            <div className="absolute top-4 right-6">
              <span className="font-hand text-lg text-warm-400">📍 Right now...</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              现在在干嘛
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">📍</span>
                <div>
                  <p className="font-medium">首尔，韩国</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">搬来两个月了，合井附近</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">💻</span>
                <div>
                  <p className="font-medium">Building WorkWorkOrg</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">远程工作者社区 v0.3</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">📚</span>
                <div>
                  <p className="font-medium">学韩语 + Rust</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">TOPIK 2 水平，还在跟 borrow checker 较劲</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">🎮</span>
                <div>
                  <p className="font-medium">沉迷 Hades II</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">已经50小时了救命 🥹</p>
                </div>
              </div>
            </div>
            <Link
              to="/now"
              className="inline-flex items-center gap-1 mt-6 text-sm font-medium text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 transition-colors"
            >
              完整的 /now 页面 <ArrowRight size={16} />
            </Link>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
