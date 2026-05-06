import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";

export const LANGUAGES = [
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "bn", label: "বাংলা", flag: "🇧🇩" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "ur", label: "اردو", flag: "🇵🇰" },
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "pcm", label: "Naija", flag: "🇳🇬" },
  { code: "mr", label: "मराठी", flag: "🇮🇳" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
];

const STORAGE_KEY = "yanbo-lang";
export const DISCLAIMER_ACK_KEY = "yanbo-gt-ack";

function getCurrentLang(): string {
  const hash = window.location.hash;
  const match = hash.match(/googtrans\(zh-CN\|([^)]+)\)/);
  if (match) return match[1];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  return "zh-CN";
}

export function isNonChineseLang(): boolean {
  const nav = navigator.language || (navigator as { userLanguage?: string }).userLanguage || "";
  return !nav.toLowerCase().startsWith("zh");
}

export function applyLang(code: string) {
  localStorage.setItem(STORAGE_KEY, code);
  window.__setTranslateLang(code);
}

export default function LanguageSwitcher({ onNeedDisclaimer }: { onNeedDisclaimer?: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("zh-CN");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(getCurrentLang());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(code: string) {
    setOpen(false);
    if (code === "zh-CN") {
      applyLang(code);
      return;
    }
    const acked = localStorage.getItem(DISCLAIMER_ACK_KEY);
    if (acked) {
      applyLang(code);
    } else if (onNeedDisclaimer) {
      onNeedDisclaimer(code);
    }
  }

  const currentLang = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors text-sm"
        aria-label="Switch language"
        translate="no"
      >
        <Globe size={16} className="text-gray-500 dark:text-gray-400" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300" translate="no">
          {currentLang.flag}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 max-h-80 overflow-y-auto rounded-xl bg-white dark:bg-gray-900 border border-warm-200/60 dark:border-gray-700/60 shadow-xl shadow-black/10 dark:shadow-black/30 z-[60] py-1"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-warm-50 dark:hover:bg-gray-800 transition-colors ${
                  current === lang.code
                    ? "bg-forest-50 dark:bg-forest-900/30 text-forest-700 dark:text-forest-400 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                }`}
                translate="no"
              >
                <span className="text-base" translate="no">{lang.flag}</span>
                <span translate="no">{lang.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
