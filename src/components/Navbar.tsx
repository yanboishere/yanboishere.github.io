import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import LanguageSwitcher, { applyLang, isNonChineseLang, LANGUAGES, DISCLAIMER_ACK_KEY } from "./LanguageSwitcher";
import TranslationDisclaimer from "./TranslationDisclaimer";

const navItems = [
  { path: "/", label: "首页", emoji: "🎒" },
  { path: "/blog", label: "博客", emoji: "✍️" },
  { path: "/photos", label: "照片", emoji: "📷" },
  { path: "/about", label: "关于", emoji: "🫠" },
  { path: "/now", label: "现在", emoji: "📍" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingLang, setPendingLang] = useState<string | null>(null);
  const [autoPrompted, setAutoPrompted] = useState(false);

  useEffect(() => {
    if (!autoPrompted && isNonChineseLang() && !localStorage.getItem(DISCLAIMER_ACK_KEY)) {
      setShowDisclaimer(true);
      setPendingLang("en");
      setAutoPrompted(true);
    }
  }, [autoPrompted]);

  function handleNeedDisclaimer(code: string) {
    setPendingLang(code);
    setShowDisclaimer(true);
  }

  function handleConfirm() {
    localStorage.setItem(DISCLAIMER_ACK_KEY, "1");
    setShowDisclaimer(false);
    if (pendingLang) {
      applyLang(pendingLang);
      setPendingLang(null);
    }
  }

  function handleCancel() {
    setShowDisclaimer(false);
    setPendingLang(null);
  }

  const pendingLangLabel = LANGUAGES.find((l) => l.code === pendingLang)?.label || "English";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-cream/80 dark:bg-gray-950/80 border-b border-warm-200/50 dark:border-gray-800/50">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" translate="no">
              <img src="/logo.png" alt="烟波" className="w-8 h-8 rounded-full object-cover" />
              <span className="font-hand text-2xl text-coffee dark:text-warm-300" translate="no">烟波</span>
            </Link>

            {/* desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-warm-100 dark:hover:bg-gray-800 ${
                      isActive ? "text-forest-700 dark:text-forest-400 font-medium" : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <span className="mr-1">{item.emoji}</span>
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-forest-500 rounded-full"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
              <button
                onClick={toggleTheme}
                className="ml-2 p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="切换主题"
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <LanguageSwitcher onNeedDisclaimer={handleNeedDisclaimer} />
            </div>

            {/* mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <LanguageSwitcher onNeedDisclaimer={handleNeedDisclaimer} />
              <button onClick={toggleTheme} className="p-2 rounded-lg" aria-label="切换主题">
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg" aria-label="菜单">
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* mobile nav */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden bg-cream dark:bg-gray-950 border-b border-warm-200/50 dark:border-gray-800/50"
            >
              <div className="container px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 rounded-lg text-base transition-colors ${
                        isActive
                          ? "bg-warm-100 dark:bg-gray-800 text-forest-700 dark:text-forest-400 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-warm-50 dark:hover:bg-gray-900"
                      }`}
                    >
                      <span className="mr-2">{item.emoji}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <TranslationDisclaimer
        open={showDisclaimer}
        langLabel={pendingLangLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
