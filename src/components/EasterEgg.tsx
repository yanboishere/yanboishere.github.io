import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const easterEggs = [
  "LMAO 😂",
  "爽！！！",
  "relax 🧘",
  "顶起来 🆙",
  "哇啊啊啊",
  "Nice try 👀",
  "你发现了彩蛋！🎉",
  "666",
  "ważnie?",
  "お疲れ様 ✌️",
];

export default function EasterEgg() {
  const [eggs, setEggs] = useState<Array<{ id: number; text: string; x: number; y: number }>>([]);
  const [clickCount, setClickCount] = useState(0);

  const spawnEgg = useCallback((x: number, y: number) => {
    const text = easterEggs[Math.floor(Math.random() * easterEggs.length)];
    const id = Date.now() + Math.random();
    setEggs((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setEggs((prev) => prev.filter((e) => e.id !== id));
    }, 1500);
  }, []);

  useEffect(() => {
    const handleTripleClick = () => {
      setClickCount((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          spawnEgg(
            Math.random() * (window.innerWidth - 200) + 100,
            Math.random() * (window.innerHeight - 200) + 100
          );
          return 0;
        }
        return next;
      });
    };

    document.addEventListener("click", handleTripleClick);
    const resetTimer = setInterval(() => setClickCount(0), 800);

    return () => {
      document.removeEventListener("click", handleTripleClick);
      clearInterval(resetTimer);
    };
  }, [spawnEgg]);

  return (
    <AnimatePresence>
      {eggs.map((egg) => (
        <motion.div
          key={egg.id}
          initial={{ opacity: 0, scale: 0.5, y: 0 }}
          animate={{ opacity: 1, scale: 1, y: -60 }}
          exit={{ opacity: 0, scale: 0.5, y: -100 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed pointer-events-none z-[9999] font-hand text-2xl text-sunset-500 dark:text-sunset-400"
          style={{ left: egg.x, top: egg.y }}
        >
          {egg.text}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
