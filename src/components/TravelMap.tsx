import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PageLoading from "@/components/PageLoading";
import {
  blendCamera,
  buildCameraTrack,
  buildRoute,
  cameraAt,
  cameraToLeaflet,
  collectJourneyTiles,
  durationMsForScope,
  easeInOutCubic,
  easeOutCubic,
  formatJourneyMonth,
  HOLD_MS,
  haversineKm,
  indexAtDistance,
  overviewCamera,
  OUTRO_TRANSITION_MS,
  OVERVIEW_ROUTE_ALPHA,
  pathBetweenDistances,
  positionAtDistance,
  stabilizeTileZoom,
  tileKey,
  trailRanges,
  trailWindowKm,
  type JourneyRoute,
  type TileCoord,
  type WorldCamera,
} from "@/lib/journey";
import { drawJourneyFrame, sizePlayCanvas, type TileCache } from "@/lib/journey-canvas";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const DARK_TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const JOURNEY_COLOR = "#ec6322";
const SPEED_MIN = 0.1;
const SPEED_MAX = 5;
const SPEED_STEP = 0.1;
const DEFAULT_SPEED = 1;

function formatSpeed(speed: number): string {
  return `${speed.toFixed(1).replace(/\.0$/, "")}x`;
}

type RawPoint = [number, number, number];

const YEAR_COLORS: Record<string, string> = {
  "2023": "#dda75c",
  "2024": "#3d8b5d",
  "2025": "#ec6322",
  "2026": "#b73716",
};

interface MonthInfo {
  key: string;
  year: number;
  month: number;
  label: string;
  pointCount: number;
}

function getMonthTsRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(year, month, 0);
  end.setHours(23, 59, 59, 999);
  return {
    startTs: Math.floor(start.getTime() / 1000),
    endTs: Math.floor(end.getTime() / 1000),
  };
}

function applyCamera(map: L.Map, camera: WorldCamera) {
  const size = map.getSize();
  const view = cameraToLeaflet(camera, size.x, size.y);
  map.setView(view.center, view.zoom, { animate: false });
}

function retinaSuffix(): string {
  return L.Browser.retina ? "@2x" : "";
}

function tileUrl(tile: TileCoord, dark: boolean): string {
  const template = dark ? DARK_TILE_URL : TILE_URL;
  const s = "abcd"[Math.abs(tile.x + tile.y) % 4];
  return template
    .replace("{s}", s)
    .replace("{z}", String(tile.z))
    .replace("{x}", String(tile.x))
    .replace("{y}", String(tile.y))
    .replace("{r}", retinaSuffix());
}

type SmoothTileLayer = L.TileLayer & {
  _smoothCameraPatched?: boolean;
  _tileZoom?: number;
  _setView?: (center: L.LatLng, zoom: number, noPrune?: boolean, noUpdate?: boolean) => void;
  _setZoomTransforms?: (center: L.LatLng, zoom: number) => void;
  _update?: (center: L.LatLng) => void;
};

function createBasemap(dark: boolean): L.TileLayer {
  const layer = L.tileLayer(dark ? DARK_TILE_URL : TILE_URL, {
    subdomains: "abcd",
    maxZoom: 19,
    keepBuffer: 12,
    updateWhenZooming: false,
    updateWhenIdle: false,
    className: "journey-basemap",
  }) as SmoothTileLayer;

  if (!layer._smoothCameraPatched) {
    layer._smoothCameraPatched = true;
    const originalSetView = layer._setView?.bind(layer);
    layer._setView = function (center, zoom, noPrune, noUpdate) {
      const tileZoom = Math.round(zoom);
      if (this._tileZoom === tileZoom && this._map && this._setZoomTransforms && this._update) {
        this._setZoomTransforms(center, zoom);
        this._update(center);
        return;
      }
      originalSetView?.(center, zoom, noPrune, noUpdate);
    };
  }

  return layer;
}

function preloadTiles(
  tiles: TileCoord[],
  dark: boolean,
  onProgress: (loaded: number, total: number) => void,
  signal: AbortSignal
): Promise<TileCache> {
  const unique = new Map<string, TileCoord>();
  for (const tile of tiles) unique.set(tileKey(tile.z, tile.x, tile.y), tile);
  const list = [...unique.values()];
  const cache: TileCache = new Map();
  if (list.length === 0) return Promise.resolve(cache);

  return new Promise((resolve) => {
    let nextIndex = 0;
    let finished = 0;
    let active = 0;
    const concurrency = 8;
    const total = list.length;

    const tick = () => {
      if (signal.aborted) {
        resolve(cache);
        return;
      }
      if (finished >= total) {
        resolve(cache);
        return;
      }
      while (active < concurrency && nextIndex < total) {
        const tile = list[nextIndex++];
        const key = tileKey(tile.z, tile.x, tile.y);
        active += 1;
        const img = new Image();
        let settled = false;
        const done = (ok: boolean) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          if (ok && img.complete && img.naturalWidth > 0) cache.set(key, img);
          active -= 1;
          finished += 1;
          onProgress(finished, total);
          tick();
        };
        const timer = window.setTimeout(() => done(false), 8000);
        img.onload = () => done(true);
        img.onerror = () => done(false);
        img.src = tileUrl(tile, dark);
      }
    };

    tick();
  });
}

interface TravelMapProps {
  className?: string;
  variant?: "embedded" | "fullscreen";
  autoPlay?: boolean;
  onPlayAll?: () => void;
  onExit?: () => void;
}

export default function TravelMap({
  className,
  variant = "embedded",
  autoPlay = false,
  onPlayAll,
  onExit,
}: TravelMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const isDarkRef = useRef(false);
  const rawDataRef = useRef<RawPoint[]>([]);
  const layersRef = useRef<L.Layer[]>([]);
  const animFrameRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ points: 0, distance: 0 });
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [journeyDate, setJourneyDate] = useState("");
  const [playAll, setPlayAll] = useState(autoPlay);
  const fullscreen = variant === "fullscreen";
  const [playbackSpeed, setPlaybackSpeed] = useState(DEFAULT_SPEED);
  const playbackSpeedRef = useRef(DEFAULT_SPEED);
  const [preparing, setPreparing] = useState(false);
  const [prepareProgress, setPrepareProgress] = useState({ loaded: 0, total: 0 });

  const pausedRef = useRef(false);
  const preloadAbortRef = useRef<AbortController | null>(null);
  const pausedAtRef = useRef(0);
  const totalPausedRef = useRef(0);
  const playCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressSeekRef = useRef<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthInfo | null>(null);
  const [availableMonths, setAvailableMonths] = useState<MonthInfo[]>([]);

  const clearLayers = useCallback((map: L.Map) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    preloadAbortRef.current?.abort();
    preloadAbortRef.current = null;
    playCanvasRef.current?.remove();
    playCanvasRef.current = null;
    const panes = map.getPanes();
    if (panes.tilePane) panes.tilePane.style.visibility = "";
    if (panes.overlayPane) panes.overlayPane.style.visibility = "";
    if (panes.markerPane) panes.markerPane.style.visibility = "";
    for (const layer of layersRef.current) map.removeLayer(layer);
    layersRef.current = [];
    setAnimating(false);
    setPaused(false);
    setPreparing(false);
    setProgress(0);
    progressSeekRef.current = null;
    pausedRef.current = false;
    pausedAtRef.current = 0;
    totalPausedRef.current = 0;
    map.dragging.enable();
  }, []);

  const showOverview = useCallback(
    (map: L.Map, data: RawPoint[]) => {
      clearLayers(map);
      if (data.length === 0) return;

      const allCoords: L.LatLngExpression[] = data.map((p) => [p[0], p[1]]);
      const grouped: Record<string, L.LatLngExpression[]> = {};
      for (const p of data) {
        const yr = new Date(p[2] * 1000).getFullYear().toString();
        if (!grouped[yr]) grouped[yr] = [];
        grouped[yr].push([p[0], p[1]]);
      }
      for (const [yr, pts] of Object.entries(grouped)) {
        const color = YEAR_COLORS[yr] || "#dda75c";
        const line = L.polyline(pts, {
          color,
          weight: 2.5,
          opacity: 0.85,
          smoothFactor: 1.5,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
        layersRef.current.push(line);
      }

      map.fitBounds(L.latLngBounds(allCoords), { padding: [30, 30], maxZoom: 5 });

      let totalDist = 0;
      for (let i = 1; i < allCoords.length; i++) {
        const a = allCoords[i - 1] as [number, number];
        const b = allCoords[i] as [number, number];
        totalDist += haversineKm(a[0], a[1], b[0], b[1]);
      }
      setStats({ points: data.length, distance: Math.round(totalDist) });
      setJourneyDate("");
    },
    [clearLayers]
  );

  const startJourney = useCallback(
    (map: L.Map, data: RawPoint[], month: MonthInfo | null, year: string | null) => {
      clearLayers(map);
      map.dragging.disable();

      const filtered = month
        ? data.filter((p) => {
            const { startTs, endTs } = getMonthTsRange(month.year, month.month);
            return p[2] >= startTs && p[2] <= endTs;
          })
        : year
          ? data.filter((p) => new Date(p[2] * 1000).getFullYear().toString() === year)
          : data;

      if (filtered.length === 0) {
        setStats({ points: 0, distance: 0 });
        map.dragging.enable();
        return;
      }

      const route = buildRoute(filtered);
      if (!route) {
        map.dragging.enable();
        return;
      }

      const color = year ? YEAR_COLORS[year] || JOURNEY_COLOR : JOURNEY_COLOR;
      const scope = month ? "month" : year ? "year" : "all";
      const duration = durationMsForScope(scope);
      const windowKm = trailWindowKm(route.totalKm, duration / 1000);
      map.invalidateSize();
      const size = map.getSize();
      const overviewPath = pathBetweenDistances(route, 0, route.totalKm);

      const track = buildCameraTrack(route, size.x, size.y);
      const overview = overviewCamera(route, size.x, size.y);
      let camera: WorldCamera = track[0] || overview;
      let drawZoom = stabilizeTileZoom(null, cameraToLeaflet(camera, size.x, size.y).zoom);
      let tileCache: TileCache = new Map();

      const canvas = document.createElement("canvas");
      canvas.className = "journey-play-canvas";
      map.getContainer().appendChild(canvas);
      playCanvasRef.current = canvas;
      let ctx = sizePlayCanvas(canvas, size.x, size.y);

      setPreparing(true);
      setPrepareProgress({ loaded: 0, total: 0 });
      setAnimating(false);
      setPaused(false);
      setProgress(0);
      setStats({ points: filtered.length, distance: Math.round(route.totalKm) });
      setJourneyDate(formatJourneyMonth(route.timestamps[0]));

      totalPausedRef.current = 0;
      let phase: "play" | "ending" | "hold" = "play";
      let endingFrom: WorldCamera | null = null;
      let endingTo: WorldCamera | null = null;
      let phaseStarted = 0;
      let lastDate = formatJourneyMonth(route.timestamps[0]);
      let lastPct = -1;
      let lastFrame = 0;
      let lastTick = 0;
      let journeyElapsed = 0;
      let lastDistanceKm = 0;

      function paint(routeNow: JourneyRoute, distanceKm: number, outro = 0) {
        const viewSize = map.getSize();
        if (!ctx || canvas.clientWidth !== viewSize.x || canvas.clientHeight !== viewSize.y) {
          ctx = sizePlayCanvas(canvas, viewSize.x, viewSize.y);
        }
        if (!ctx) return positionAtDistance(routeNow, distanceKm);

        const headPos = positionAtDistance(routeNow, distanceKm);
        const ranges = trailRanges(distanceKm, windowKm);
        const trailFade = 1 - easeOutCubic(outro);
        const zoom = cameraToLeaflet(camera, viewSize.x, viewSize.y).zoom;
        drawZoom = stabilizeTileZoom(drawZoom, zoom);

        drawJourneyFrame(ctx, {
          camera,
          cache: tileCache,
          tileZoom: drawZoom,
          width: viewSize.x,
          height: viewSize.y,
          color,
          oldTrail: pathBetweenDistances(routeNow, ranges.old[0], ranges.old[1]),
          middleTrail: pathBetweenDistances(routeNow, ranges.middle[0], ranges.middle[1]),
          recentTrail: pathBetweenDistances(routeNow, ranges.recent[0], ranges.recent[1]),
          overviewPath,
          head: headPos,
          trailFade,
          overviewAlpha: OVERVIEW_ROUTE_ALPHA * easeInOutCubic(outro),
        });

        const idx = indexAtDistance(routeNow.cumDist, distanceKm);
        const label = formatJourneyMonth(routeNow.timestamps[idx]);
        if (label !== lastDate) {
          lastDate = label;
          setJourneyDate(label);
        }
        lastDistanceKm = distanceKm;
        return headPos;
      }

      function finishOverview() {
        animFrameRef.current = 0;
        setAnimating(false);
        setProgress(1);
        map.dragging.enable();
        canvas.remove();
        playCanvasRef.current = null;
        const panes = map.getPanes();
        if (panes.tilePane) panes.tilePane.style.visibility = "";
        if (panes.overlayPane) panes.overlayPane.style.visibility = "";
        if (panes.markerPane) panes.markerPane.style.visibility = "";
        applyCamera(map, overview);

        if (!year && !month) {
          const grouped: Record<string, L.LatLngExpression[]> = {};
          for (const p of filtered) {
            const yr = new Date(p[2] * 1000).getFullYear().toString();
            if (!grouped[yr]) grouped[yr] = [];
            grouped[yr].push([p[0], p[1]]);
          }
          for (const [yr, pts] of Object.entries(grouped)) {
            const line = L.polyline(pts, {
              color: YEAR_COLORS[yr] || "#dda75c",
              weight: 2.5,
              opacity: 0.9,
              smoothFactor: 1.5,
              lineCap: "round",
              lineJoin: "round",
            }).addTo(map);
            layersRef.current.push(line);
          }
        } else {
          const overviewLine = L.polyline(overviewPath, {
            color,
            weight: 2.5,
            opacity: 0.85,
            smoothFactor: 1,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          layersRef.current.push(overviewLine);
        }
      }

      function applyJourneyTime(t: number, outro = 0) {
        const clamped = Math.min(1, Math.max(0, t));
        const pct = Math.round(clamped * 200) / 200;
        if (pct !== lastPct) {
          lastPct = pct;
          setProgress(pct);
        }
        camera = cameraAt(track, clamped);
        paint(route, route.distanceAt(clamped), outro);
        return clamped;
      }

      function animate(now: number) {
        let didSeek = false;
        if (progressSeekRef.current != null) {
          const seekT = Math.min(1, Math.max(0, progressSeekRef.current));
          progressSeekRef.current = null;
          journeyElapsed = seekT * duration;
          phase = "play";
          lastTick = now;
          lastFrame = now;
          applyJourneyTime(seekT, 0);
          didSeek = true;
          if (seekT >= 1) {
            phase = "ending";
            phaseStarted = now;
            endingFrom = camera;
            endingTo = overview;
          }
        }

        if (pausedRef.current && phase === "play") {
          lastTick = now;
          animFrameRef.current = requestAnimationFrame(animate);
          return;
        }

        if (phase === "play" && !didSeek) {
          if (now - lastFrame < 32) {
            animFrameRef.current = requestAnimationFrame(animate);
            return;
          }
          const dt = Math.min(now - lastTick, 100);
          lastTick = now;
          lastFrame = now;
          journeyElapsed += dt * playbackSpeedRef.current;
          const t = applyJourneyTime(Math.min(journeyElapsed / duration, 1), 0);

          if (t >= 1) {
            phase = "ending";
            phaseStarted = now;
            endingFrom = camera;
            endingTo = overview;
          }
        } else if (phase === "ending" && endingFrom && endingTo) {
          const t = Math.min((now - phaseStarted) / OUTRO_TRANSITION_MS, 1);
          camera = blendCamera(endingFrom, endingTo, easeOutCubic(t));
          paint(route, lastDistanceKm || route.totalKm, t);
          if (t >= 1) {
            phase = "hold";
            phaseStarted = now;
          }
        } else if (phase === "hold") {
          paint(route, route.totalKm, 1);
          if (now - phaseStarted >= HOLD_MS) {
            finishOverview();
            return;
          }
        }

        animFrameRef.current = requestAnimationFrame(animate);
      }

      const abort = new AbortController();
      preloadAbortRef.current = abort;
      const tiles = collectJourneyTiles(track, overview, size.x, size.y);
      setPrepareProgress({ loaded: 0, total: tiles.length });

      void preloadTiles(
        tiles,
        isDarkRef.current,
        (loaded, total) => {
          if (!abort.signal.aborted) setPrepareProgress({ loaded, total });
        },
        abort.signal
      ).then((cache) => {
        if (abort.signal.aborted || mapInstanceRef.current !== map) return;
        tileCache = cache;
        const panes = map.getPanes();
        if (panes.tilePane) panes.tilePane.style.visibility = "hidden";
        if (panes.overlayPane) panes.overlayPane.style.visibility = "hidden";
        if (panes.markerPane) panes.markerPane.style.visibility = "hidden";
        paint(route, 0, 0);
        setPreparing(false);
        setAnimating(true);
        const start = performance.now();
        lastTick = start;
        lastFrame = start;
        journeyElapsed = 0;
        phaseStarted = start;
        animFrameRef.current = requestAnimationFrame(animate);
      });
    },
    [clearLayers]
  );

  const togglePause = useCallback(() => {
    if (!animating || progress >= 1) return;
    if (pausedRef.current) {
      totalPausedRef.current += performance.now() - pausedAtRef.current;
      pausedRef.current = false;
      setPaused(false);
    } else {
      pausedAtRef.current = performance.now();
      pausedRef.current = true;
      setPaused(true);
    }
  }, [animating, progress]);

  const replayRoute = useCallback(() => {
    const map = mapInstanceRef.current;
    const data = rawDataRef.current;
    if (!map || data.length === 0) return;
    startJourney(map, data, selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, startJourney]);

  const renderCurrent = useCallback(
    (map: L.Map, data: RawPoint[]) => {
      if (selectedMonth || selectedYear || playAll) {
        startJourney(map, data, selectedMonth, selectedYear);
      } else {
        showOverview(map, data);
      }
    },
    [selectedMonth, selectedYear, playAll, startJourney, showOverview]
  );

  useEffect(() => {
    if (!mapRef.current) return;
    let alive = true;
    const container = mapRef.current;

    const isDark = document.documentElement.classList.contains("dark");
    isDarkRef.current = isDark;

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: fullscreen,
      dragging: true,
      doubleClickZoom: true,
      touchZoom: true,
      minZoom: 2,
      maxZoom: 16,
      zoomSnap: 0,
      zoomDelta: 0.25,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      worldCopyJump: true,
      renderer: L.canvas({ padding: 0.5 }),
    });
    map.setView([20, 80], 3);
    mapInstanceRef.current = map;

    if (!fullscreen) {
      L.control.zoom({ position: "bottomright" }).addTo(map);
    }
    map.attributionControl.setPrefix(false);
    map.attributionControl.addAttribution('© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/attributions">CARTO</a>');

    const tileLayer = createBasemap(isDark).addTo(map);
    tileLayerRef.current = tileLayer;

    fetch("/travel-route.json")
      .then((res) => res.json())
      .then((data: RawPoint[]) => {
        if (!alive) return;
        map.invalidateSize();
        rawDataRef.current = data;

        const monthMap = new Map<string, number>();
        for (const p of data) {
          const d = new Date(p[2] * 1000);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthMap.set(key, (monthMap.get(key) || 0) + 1);
        }

        const months: MonthInfo[] = [];
        for (const [key, count] of monthMap.entries()) {
          const [y, m] = key.split("-").map(Number);
          months.push({
            key,
            year: y,
            month: m,
            label: `${y}年${m}月`,
            pointCount: count,
          });
        }
        months.sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month));
        setAvailableMonths(months);

        if (autoPlay) {
          setPlayAll(true);
          setPreparing(true);
          startJourney(map, data, null, null);
        } else {
          showOverview(map, data);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("Failed to load travel route:", err);
        setLoading(false);
      });

    const syncSize = () => map.invalidateSize();
    window.addEventListener("resize", syncSize);
    document.addEventListener("fullscreenchange", syncSize);
    document.addEventListener("webkitfullscreenchange", syncSize);

    return () => {
      alive = false;
      window.removeEventListener("resize", syncSize);
      document.removeEventListener("fullscreenchange", syncSize);
      document.removeEventListener("webkitfullscreenchange", syncSize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
    };
  }, [showOverview, startJourney, autoPlay, fullscreen]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const data = rawDataRef.current;
    if (!map || data.length === 0) return;
    renderCurrent(map, data);
  }, [selectedMonth, selectedYear, playAll, renderCurrent]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark === isDarkRef.current) return;
      isDarkRef.current = isDark;

      if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
      const newTile = createBasemap(isDark).addTo(map);
      tileLayerRef.current = newTile;
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleYearClick = (year: string) => {
    setPlayAll(false);
    if (selectedYear === year) {
      setSelectedYear(null);
      setSelectedMonth(null);
    } else {
      setSelectedYear(year);
      setSelectedMonth(null);
    }
  };

  const handleMonthClick = (month: MonthInfo) => {
    setPlayAll(false);
    if (selectedMonth?.key === month.key) {
      setSelectedMonth(null);
    } else {
      setSelectedMonth(month);
    }
  };

  const handleReset = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setPlayAll(false);
  };

  const handleSpeedChange = (value: number) => {
    const next = Math.min(SPEED_MAX, Math.max(SPEED_MIN, Math.round(value * 10) / 10));
    playbackSpeedRef.current = next;
    setPlaybackSpeed(next);
  };

  const handleSeek = (value: number) => {
    const next = Math.min(1, Math.max(0, value));
    setProgress(next);
    if (animating) progressSeekRef.current = next;
  };

  const speedControl = (opts?: { withDivider?: boolean; compact?: boolean }) => {
    const withDivider = opts?.withDivider ?? false;
    const compact = opts?.compact ?? false;
    return (
      <label
        className={`block ${withDivider ? "mt-2 pt-2 border-t border-warm-200/60 dark:border-gray-700/60" : ""}`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mb-0.5 flex items-center justify-between gap-2 whitespace-nowrap text-[10px] text-gray-500 dark:text-gray-400">
          <span>回放速度</span>
          <span className="font-mono text-forest-600 dark:text-forest-400">{formatSpeed(playbackSpeed)}</span>
        </div>
        <input
          type="range"
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={SPEED_STEP}
          value={playbackSpeed}
          onInput={(e) => handleSpeedChange(Number((e.target as HTMLInputElement).value))}
          onChange={(e) => handleSpeedChange(Number(e.target.value))}
          className="journey-speed w-full"
          aria-label="回放速度"
        />
        {!compact && (
          <div className="mt-0.5 flex justify-between text-[9px] text-gray-400 dark:text-gray-500">
            <span>0.1x</span>
            <span>5x</span>
          </div>
        )}
      </label>
    );
  };

  const groupedByYear = useMemo(() => {
    const groups: Record<string, MonthInfo[]> = {};
    for (const m of availableMonths) {
      const y = m.year.toString();
      if (!groups[y]) groups[y] = [];
      groups[y].push(m);
    }
    return groups;
  }, [availableMonths]);

  const journeyTitle = selectedMonth
    ? selectedMonth.label
    : selectedYear
      ? `${selectedYear}年`
      : "全部旅程";

  const yearPicker = !loading && availableMonths.length > 0 && (
        <div className="absolute left-3 z-[1000]" style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}>
          <div className="max-h-[min(42vh,280px)] w-[min(180px,calc(100vw-1.5rem))] overflow-y-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl shadow-lg shadow-black/10 border border-warm-200/50 dark:border-gray-700/50 p-3 landscape:max-h-[min(28vh,168px)] landscape:p-2 md:w-[200px]">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              📅 {selectedYear ? `${selectedYear}年` : "选择年份"}
            </div>

            {!selectedYear && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(groupedByYear).map(([year]) => {
                  const color = YEAR_COLORS[year] || "#dda75c";
                  return (
                    <button
                      key={year}
                      onClick={() => handleYearClick(year)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all text-gray-600 dark:text-gray-300 hover:bg-warm-50 dark:hover:bg-gray-800/50"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {year}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedYear && !selectedMonth && (
              <div>
                <button
                  onClick={() => {
                    setSelectedYear(null);
                    setSelectedMonth(null);
                    setPlayAll(false);
                  }}
                  className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-2 flex items-center gap-0.5 transition-colors"
                >
                  {"← 返回"}
                </button>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(groupedByYear[selectedYear] || []).map((m) => (
                    <button
                      key={m.key}
                      onClick={() => handleMonthClick(m)}
                      className="px-2 py-1 rounded-md text-xs transition-all text-gray-600 dark:text-gray-300 hover:bg-warm-50 dark:hover:bg-gray-800/50"
                    >
                      {m.month}月
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleReset}
                  className="w-full text-xs text-center py-1.5 rounded-lg bg-warm-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-warm-100 dark:hover:bg-gray-700 transition-colors"
                >
                  🌍 查看全部轨迹
                </button>
              </div>
            )}

            {selectedYear && selectedMonth && (
              <div>
                <button
                  onClick={() => setSelectedMonth(null)}
                  className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-2 flex items-center gap-0.5 transition-colors"
                >
                  {"← 返回月份"}
                </button>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(groupedByYear[selectedYear] || []).map((m) => {
                    const isActive = selectedMonth.key === m.key;
                    const color = YEAR_COLORS[selectedYear] || "#dda75c";
                    return (
                      <button
                        key={m.key}
                        onClick={() => handleMonthClick(m)}
                        className="px-2 py-1 rounded-md text-xs transition-all"
                        style={
                          isActive
                            ? { backgroundColor: `${color}20`, color, fontWeight: 600, boxShadow: `0 0 8px ${color}30` }
                            : { color: "#9ca3af" }
                        }
                      >
                        {m.month}月
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleReset}
                  className="w-full text-xs text-center py-1.5 rounded-lg bg-warm-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-warm-100 dark:hover:bg-gray-700 transition-colors"
                >
                  🌍 查看全部轨迹
                </button>
              </div>
            )}

            {!selectedYear && (
              <div className="mt-2 text-[10px] text-center text-gray-400 dark:text-gray-500">
                先选年份，再选月份
              </div>
            )}
          </div>
        </div>
  );

  const statusCard = !loading && (selectedYear || selectedMonth || playAll || animating) && stats.points > 0 && (
        <div className="absolute right-3 z-[1000]" style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}>
          <div className="max-w-[min(220px,calc(100vw-1.5rem))] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg shadow-lg shadow-black/10 border border-warm-200/50 dark:border-gray-700/50 px-3 py-2 min-w-[148px]">
            <div className="text-[1.3125rem] font-medium leading-snug text-gray-800 dark:text-gray-200">
              {journeyDate || `${journeyTitle} 我的轨迹`}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats.distance.toLocaleString()} km
              {animating ? (
                <button
                  onClick={togglePause}
                  className="ml-1.5 inline-block text-forest-500 hover:text-forest-600 dark:text-forest-400 dark:hover:text-forest-300 transition-colors cursor-pointer"
                >
                  {paused ? "⏸ 已暂停" : "▸ 旅程中"}
                </button>
              ) : (
                <button
                  onClick={replayRoute}
                  className="ml-1.5 text-forest-500 hover:text-forest-600 dark:text-forest-400 dark:hover:text-forest-300 underline underline-offset-2 transition-colors"
                >
                  再次回放
                </button>
              )}
              {playAll && !selectedYear && (
                <button
                  onClick={() => setPlayAll(false)}
                  className="ml-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  退出
                </button>
              )}
            </div>
            {!fullscreen && (animating || progress > 0) && (
              <div className="mt-2 h-1 rounded-full bg-warm-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sunset-500 transition-[width] duration-75"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            )}
            {!fullscreen && speedControl({ withDivider: true })}
          </div>
        </div>
  );

  const loadingOverlay = (loading || preparing) && (
        <div className={`absolute inset-0 flex items-center justify-center bg-warm-50/80 dark:bg-gray-900/80 ${fullscreen ? "" : "rounded-2xl"} pointer-events-none z-[1100]`}>
          <PageLoading
            size="md"
            text={
              preparing
                ? prepareProgress.total > 0
                  ? `地图加载中 ${prepareProgress.loaded}/${prepareProgress.total}`
                  : "正在准备地图…"
                : "地图上，又画了一条线。"
            }
          />
        </div>
  );

  if (fullscreen) {
    return (
      <div className={`flex h-full min-h-0 w-full flex-col overflow-hidden bg-cream dark:bg-gray-950 ${className || ""}`}>
        <div className="relative min-h-0 w-full flex-1">
          <div ref={mapRef} className="absolute inset-0 overflow-hidden" />
          {yearPicker}
          {statusCard}
          {loadingOverlay}
        </div>
        <div
          className="theater-chrome flex w-full flex-none flex-col gap-1.5 border-t border-warm-200/50 bg-cream pt-2 landscape:flex-row landscape:items-center landscape:gap-3 dark:border-gray-800/50 dark:bg-gray-950"
          style={{
            paddingBottom: "max(1.75rem, calc(env(safe-area-inset-bottom, 0px) + 1.25rem))",
            paddingLeft: "max(1rem, calc(env(safe-area-inset-left, 0px) + 0.75rem))",
            paddingRight: "max(1rem, calc(env(safe-area-inset-right, 0px) + 0.75rem))",
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 landscape:flex-none landscape:justify-start">
            {onExit && (
              <button
                onClick={onExit}
                className="touch-manipulation rounded-md px-3 py-2.5 text-xs text-gray-600 transition-colors hover:bg-warm-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                ✕ 退出
              </button>
            )}
            <div className="hidden items-center gap-3 min-[1100px]:flex">
              {Object.entries(YEAR_COLORS).map(([year, color]) => (
                <div key={year} className="flex items-center gap-1.5 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-gray-500 dark:text-gray-400">{year}</span>
                </div>
              ))}
            </div>
            {stats.points > 0 && (
              <span className="font-mono text-sm text-sunset-500 landscape:max-[1099px]:hidden">
                {stats.distance.toLocaleString()} km
              </span>
            )}
            <button
              onClick={() => (animating ? togglePause() : playAll || selectedYear || selectedMonth ? replayRoute() : setPlayAll(true))}
              className="touch-manipulation min-h-11 rounded-full bg-forest-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-forest-700 landscape:min-h-9 dark:bg-forest-500 dark:hover:bg-forest-600"
            >
              {animating ? (paused ? "▸ 继续" : "⏸ 暂停") : "▸ 播放旅程"}
            </button>
          </div>
          <div
            className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-x-3 landscape:mx-0 landscape:max-w-none landscape:flex-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <label className="block min-w-0">
              <div className="mb-0.5 flex items-center justify-between gap-2 whitespace-nowrap text-[10px] text-gray-500 dark:text-gray-400">
                <span>回放进度</span>
                <span className="font-mono">{Math.round(progress * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={progress}
                disabled={!animating}
                onInput={(e) => handleSeek(Number((e.target as HTMLInputElement).value))}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="journey-seek w-full"
                aria-label="回放进度"
              />
            </label>
            <div className="min-w-0">{speedControl({ compact: true })}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ""}`}>
      <div
        ref={mapRef}
        className="w-full h-[360px] md:h-[480px] rounded-2xl overflow-hidden border border-warm-200/40 dark:border-gray-800/40"
      />
      {yearPicker}
      {statusCard}
      {!loading && !selectedYear && !selectedMonth && !playAll && !animating && (
        <div className="absolute top-3 right-3 z-[1000]">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg shadow-lg shadow-black/10 border border-warm-200/50 dark:border-gray-700/50 px-3 py-2 w-[160px]">
            {speedControl()}
          </div>
        </div>
      )}
      {loadingOverlay}

      {!loading && stats.points > 0 && !selectedMonth && !selectedYear && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm">
          {Object.entries(YEAR_COLORS).map(([year, color]) => (
            <div key={year} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-gray-500 dark:text-gray-400">{year}</span>
            </div>
          ))}
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span className="text-gray-500 dark:text-gray-400">
            <span className="font-mono text-sunset-500">{stats.distance.toLocaleString()}</span> km
          </span>
          {!playAll && (
            <button
              onClick={() => (onPlayAll ? onPlayAll() : setPlayAll(true))}
              className="px-3 py-1 rounded-full text-xs font-medium bg-forest-600 text-white dark:bg-forest-500 hover:bg-forest-700 dark:hover:bg-forest-600 transition-colors"
            >
              ▸ 播放旅程
            </button>
          )}
        </div>
      )}
    </div>
  );
}
