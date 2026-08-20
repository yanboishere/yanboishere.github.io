import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TravelMap from "@/components/TravelMap";
import { exitAppFullscreen, isAppFullscreen, requestAppFullscreen } from "@/lib/fullscreen";

export default function Footprints() {
  const navigate = useNavigate();
  const frameRef = useRef<HTMLDivElement>(null);
  const enteredFullscreenRef = useRef(false);

  const handleExit = useCallback(() => {
    void exitAppFullscreen();
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const node = frameRef.current;
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
      bodyTop: body.style.top,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.top = "0";

    const syncViewport = () => {
      if (!node) return;
      const vv = window.visualViewport;
      const height = Math.round(vv?.height ?? window.innerHeight);
      const top = Math.round(vv?.offsetTop ?? 0);
      node.style.height = `${height}px`;
      node.style.top = `${top}px`;
      window.dispatchEvent(new Event("resize"));
    };

    syncViewport();
    window.visualViewport?.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("orientationchange", syncViewport);

    if (node && !isAppFullscreen()) {
      void requestAppFullscreen(node).then(() => {
        enteredFullscreenRef.current = isAppFullscreen();
        syncViewport();
      });
    }

    const leaveIfExited = () => {
      if (enteredFullscreenRef.current && !isAppFullscreen()) {
        navigate("/", { replace: true });
      }
    };
    document.addEventListener("fullscreenchange", leaveIfExited);
    document.addEventListener("webkitfullscreenchange", leaveIfExited);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleExit();
    };
    window.addEventListener("keydown", onKey);

    const timer = window.setTimeout(syncViewport, 120);

    return () => {
      window.clearTimeout(timer);
      window.visualViewport?.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
      document.removeEventListener("fullscreenchange", leaveIfExited);
      document.removeEventListener("webkitfullscreenchange", leaveIfExited);
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.width = prev.bodyWidth;
      body.style.top = prev.bodyTop;
    };
  }, [navigate, handleExit]);

  return (
    <div
      ref={frameRef}
      className="fixed inset-x-0 top-0 z-[80] w-screen overflow-hidden bg-cream dark:bg-gray-950"
      style={{ height: "100dvh" }}
    >
      <TravelMap variant="fullscreen" autoPlay onExit={handleExit} />
    </div>
  );
}
