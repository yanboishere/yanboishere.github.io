import { useState, useEffect } from "react";

const STORAGE_KEY = "yanbo-visitor-count";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    const newCount = stored + 1;
    localStorage.setItem(STORAGE_KEY, String(newCount));
    setCount(newCount);
  }, []);

  if (count === null) return null;

  return (
    <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">
      你是第 <span className="font-hand text-sunset-500 dark:text-sunset-400 text-base">{count.toLocaleString()}</span> 个来到这里的人 👋
    </p>
  );
}
