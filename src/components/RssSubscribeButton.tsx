import { useState } from "react";
import { Rss, Check } from "lucide-react";
import { RSS_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

interface RssSubscribeButtonProps {
  variant?: "inline" | "icon";
  className?: string;
}

export default function RssSubscribeButton({
  variant = "inline",
  className,
}: RssSubscribeButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(RSS_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = RSS_URL;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "p-2 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-800 dark:hover:text-gray-300",
          className
        )}
        aria-label={copied ? "已复制 RSS 链接" : "复制 RSS 链接"}
        title={copied ? "已复制" : "复制 RSS 链接"}
      >
        {copied ? <Check size={20} className="text-forest-500" /> : <Rss size={20} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-forest-600 dark:hover:text-forest-400 transition-colors shrink-0",
        className
      )}
      aria-label={copied ? "已复制 RSS 链接" : "复制 RSS 链接"}
      title={copied ? "已复制" : "复制 RSS 链接"}
    >
      {copied ? <Check size={15} className="text-forest-500" /> : <Rss size={15} />}
      <span>{copied ? "已复制" : "RSS"}</span>
    </button>
  );
}