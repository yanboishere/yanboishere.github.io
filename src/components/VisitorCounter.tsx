import { useState, useEffect } from "react";

const NAMESPACE = "yanboishere.github.io";
const KEY = "page-hits";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sessionKey = "yanbo-visited";
    const url = sessionStorage.getItem(sessionKey)
      ? `https://api.countapi.xyz/get/${NAMESPACE}/${KEY}`
      : `https://api.countapi.xyz/hit/${NAMESPACE}/${KEY}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.value === "number") {
          setCount(data.value);
        }
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, "1");
        }
      })
      .catch(() => setCount(null));
  }, []);

  if (count === null) return null;

  return (
    <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">
      你是第 <span className="font-hand text-sunset-500 dark:text-sunset-400 text-base">{count.toLocaleString()}</span> 个来到这里的人 👋
    </p>
  );
}
