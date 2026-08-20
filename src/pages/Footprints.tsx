import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TravelMap from "@/components/TravelMap";
import { exitAppFullscreen, isAppFullscreen, requestAppFullscreen } from "@/lib/fullscreen";

export default function Footprints() {
  const navigate = useNavigate();
  const frameRef = useRef<HTMLDivElement>(null);

  const handleExit = useCallback(() => {
    void exitAppFullscreen();
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const node = frameRef.current;
    if (node && !isAppFullscreen()) {
      void requestAppFullscreen(node);
    }

    const leaveIfExited = () => {
      if (!isAppFullscreen()) navigate("/", { replace: true });
    };
    document.addEventListener("fullscreenchange", leaveIfExited);
    document.addEventListener("webkitfullscreenchange", leaveIfExited);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleExit();
    };
    window.addEventListener("keydown", onKey);

    const onResize = () => window.dispatchEvent(new Event("resize"));
    const timer = window.setTimeout(onResize, 120);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("fullscreenchange", leaveIfExited);
      document.removeEventListener("webkitfullscreenchange", leaveIfExited);
      window.removeEventListener("keydown", onKey);
    };
  }, [navigate, handleExit]);

  return (
    <div ref={frameRef} className="fixed inset-0 z-[80] h-[100dvh] w-screen overflow-hidden bg-cream dark:bg-gray-950">
      <TravelMap variant="fullscreen" autoPlay onExit={handleExit} />
    </div>
  );
}
