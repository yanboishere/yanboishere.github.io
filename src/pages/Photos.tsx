import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { photos } from "@/data/photos";
import FadeIn from "@/components/FadeIn";
import PageTransition from "@/components/PageTransition";

export default function Photos() {
  const [selectedPhoto, setSelectedPhoto] = useState<(typeof photos)[0] | null>(null);

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* header */}
        <div className="pt-28 pb-12 px-4">
          <FadeIn>
            <div className="container max-w-5xl mx-auto">
              <h1 className="font-display text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                照片 & 旅行
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed">
                用镜头记路。每张照片背后都是一个故事。
              </p>
              <div className="mt-6 w-16 h-px bg-coffee/40 dark:bg-warm-500/40" />
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 text-sm text-gray-500 dark:text-gray-400 hover:text-coffee dark:hover:text-warm-300 transition-colors"
              >
                更多照片，请见 Instagram →
              </a>
            </div>
          </FadeIn>
        </div>

        {/* full-bleed photo grid — inspired by Ogawa Yasuhiro */}
        <FadeIn delay={0.15}>
          <div className="w-full px-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[10px]">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-white text-xs font-medium drop-shadow-lg">{photo.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* bottom text */}
        <FadeIn delay={0.3}>
          <div className="container max-w-5xl mx-auto px-4 py-16">
            <p className="text-gray-400 dark:text-gray-600 text-sm italic font-hand text-lg">
              "在迷路中找到的风景，往往比目的地更美。"
            </p>
          </div>
        </FadeIn>
      </div>

      {/* lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-10"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={28} />
            </button>

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="max-w-5xl w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.src.replace("w=800", "w=1400")}
                alt={selectedPhoto.alt}
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
              <div className="mt-6 text-center">
                <p className="text-white/80 text-sm">{selectedPhoto.location} · {selectedPhoto.date}</p>
                {selectedPhoto.story && (
                  <p className="text-white/50 text-sm mt-3 max-w-lg mx-auto font-hand text-base italic">
                    "{selectedPhoto.story}"
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
