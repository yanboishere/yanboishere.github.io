import { useMemo } from "react";
import { motion } from "framer-motion";
import { getRandomLoadingText } from "@/data/loadingTexts";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

export default function PageLoading({
  text,
  className,
  size = "lg",
  fullPage = false,
}: PageLoadingProps) {
  const loadingText = useMemo(
    () => text ?? getRandomLoadingText(),
    [text]
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        fullPage && "min-h-[calc(100vh-10rem)]",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={loadingText}
    >
      <span
        className={cn(
          "loading-ball",
          size === "sm" && "loading-ball-sm",
          size === "md" && "loading-ball-md",
          size === "lg" && "loading-ball-lg"
        )}
      />
      {loadingText && (
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
          className="mt-6 block text-sm text-gray-500 dark:text-gray-400 font-hand tracking-wide"
        >
          {loadingText}
        </motion.span>
      )}
    </div>
  );
}

export function FullPageLoading({ text, className }: { text?: string; className?: string }) {
  return (
    <div className={cn("min-h-screen pt-24", className)}>
      <PageLoading text={text} fullPage />
    </div>
  );
}

export function BlockLoading({
  text,
  className,
  style,
}: {
  text?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "flex h-[500px] items-center justify-center rounded-lg bg-warm-50 dark:bg-gray-800/60",
        className
      )}
      style={style}
    >
      <PageLoading text={text} size="md" />
    </div>
  );
}