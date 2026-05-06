import { Github, Twitter, Mail } from "lucide-react";
import { FaBilibili, FaYoutube, FaLinkedinIn } from "react-icons/fa6";
import { SiXiaohongshu, SiInstagram } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="border-t border-warm-200/50 dark:border-gray-800/50 mt-20">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="font-hand text-xl text-coffee dark:text-warm-300" translate="no">
              一个数字游民的博客 🎒
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Drop out · Digital Nomad · Writing code & stories on the road
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <a
              href="https://twitter.com/yanbo2004"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </a>
            <a
              href="https://github.com/yanbo2004"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              aria-label="GitHub"
            >
              <Github size={20} />
            </a>
            <a
              href="https://space.bilibili.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              aria-label="Bilibili"
            >
              <FaBilibili size={20} />
            </a>
            <a
              href="https://www.xiaohongshu.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              aria-label="小红书"
            >
              <SiXiaohongshu size={18} />
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              aria-label="Instagram"
            >
              <SiInstagram size={18} />
            </a>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              aria-label="YouTube"
            >
              <FaYoutube size={22} />
            </a>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn size={18} />
            </a>
            <a
              href="mailto:hi@yanbo.dev"
              className="p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              aria-label="Email"
            >
              <Mail size={20} />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-warm-200/30 dark:border-gray-800/30 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600" translate="no">
            © {new Date().getFullYear()} 烟波 Yanbo · A Digital Nomad's Blog
          </p>
        </div>
      </div>
    </footer>
  );
}
