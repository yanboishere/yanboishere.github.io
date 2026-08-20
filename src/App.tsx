import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EasterEgg from "@/components/EasterEgg";
import Home from "@/pages/Home";
import BlogList from "@/pages/BlogList";
import BlogPost from "@/pages/BlogPost";
import Photos from "@/pages/Photos";
import About from "@/pages/About";
import Now from "@/pages/Now";
import Friends from "@/pages/Friends";
import Footprints from "@/pages/Footprints";
import { useEffect } from "react";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/footprints" element={<Footprints />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/about" element={<About />} />
        <Route path="/now" element={<Now />} />
        <Route path="/friends" element={<Friends />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen pt-24 flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl mb-4">🫠</p>
                <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  404 — 走丢了
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  这个页面不存在诶，回去看看？
                </p>
              </div>
            </div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function Shell() {
  const { pathname } = useLocation();
  const theater = pathname === "/footprints";

  return (
    <>
      <ScrollToTop />
      {!theater && <div className="noise-overlay" />}
      {!theater && <Navbar />}
      <main className={theater ? "" : "min-h-screen"}>
        <AnimatedRoutes />
      </main>
      {!theater && <Footer />}
      {!theater && <EasterEgg />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}
