import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const DARK_TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

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

interface TravelMapProps {
  className?: string;
}

export default function TravelMap({ className }: TravelMapProps) {
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

  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthInfo | null>(null);
  const [availableMonths, setAvailableMonths] = useState<MonthInfo[]>([]);

  const clearLayers = useCallback((map: L.Map) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    for (const layer of layersRef.current) map.removeLayer(layer);
    layersRef.current = [];
    setAnimating(false);
  }, []);

  const renderRoutes = useCallback(
    (map: L.Map, data: RawPoint[], month: MonthInfo | null) => {
      clearLayers(map);

      if (month) {
        const { startTs, endTs } = getMonthTsRange(month.year, month.month);
        const filteredCoords: L.LatLngExpression[] = [];
        const dimCoords: L.LatLngExpression[] = [];

        for (const p of data) {
          if (p[2] >= startTs && p[2] <= endTs) {
            filteredCoords.push([p[0], p[1]]);
          } else {
            dimCoords.push([p[0], p[1]]);
          }
        }

        if (dimCoords.length > 0) {
          const dimLine = L.polyline(dimCoords, {
            color: isDarkRef.current ? "rgba(255,255,255,0.06)" : "rgba(111,78,55,0.06)",
            weight: 2,
            smoothFactor: 1.5,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          layersRef.current.push(dimLine);
        }

        if (filteredCoords.length > 0) {
          const color = YEAR_COLORS[month.year.toString()] || "#dda75c";

          const glowLine = L.polyline(filteredCoords, {
            color,
            weight: 8,
            opacity: 0.2,
            smoothFactor: 1,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          layersRef.current.push(glowLine);

          map.fitBounds(L.latLngBounds(filteredCoords), { padding: [40, 40], maxZoom: 12 });

          const animLine = L.polyline([], {
            color,
            weight: 3.5,
            opacity: 1,
            smoothFactor: 1,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          layersRef.current.push(animLine);

          setAnimating(true);
          const ANIM_DURATION = 15000;
          const totalPoints = filteredCoords.length;
          const startTime = performance.now();

          function animate(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / ANIM_DURATION, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const idx = Math.min(Math.floor(eased * totalPoints), totalPoints);
            animLine.setLatLngs(filteredCoords.slice(0, idx));
            if (progress < 1) {
              animFrameRef.current = requestAnimationFrame(animate);
            } else {
              animFrameRef.current = 0;
              setAnimating(false);
            }
          }
          animFrameRef.current = requestAnimationFrame(animate);

          let dist = 0;
          for (let i = 1; i < filteredCoords.length; i++) {
            const a = filteredCoords[i - 1] as [number, number];
            const b = filteredCoords[i] as [number, number];
            dist += haversineKm(a[0], a[1], b[0], b[1]);
          }
          setStats({ points: filteredCoords.length, distance: Math.round(dist) });
        } else {
          setStats({ points: 0, distance: 0 });
        }
      } else {
        const allCoords: L.LatLngExpression[] = data.map((p) => [p[0], p[1]]);

        const baseLine = L.polyline(allCoords, {
          color: isDarkRef.current ? "rgba(255,255,255,0.12)" : "rgba(111,78,55,0.1)",
          weight: 3,
          smoothFactor: 1.5,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
        layersRef.current.push(baseLine);

        const grouped: Record<string, L.LatLngExpression[]> = {};
        for (const p of data) {
          const year = new Date(p[2] * 1000).getFullYear().toString();
          if (!grouped[year]) grouped[year] = [];
          grouped[year].push([p[0], p[1]]);
        }
        for (const [year, pts] of Object.entries(grouped)) {
          const color = YEAR_COLORS[year] || "#dda75c";
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
      }
    },
    [clearLayers]
  );

  const replayRoute = useCallback(() => {
    const map = mapInstanceRef.current;
    const data = rawDataRef.current;
    if (!map || data.length === 0 || !selectedMonth) return;
    renderRoutes(map, data, selectedMonth);
  }, [selectedMonth, renderRoutes]);

  useEffect(() => {
    if (!mapRef.current) return;
    let alive = true;
    const container = mapRef.current;

    const isDark = document.documentElement.classList.contains("dark");
    isDarkRef.current = isDark;

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
      doubleClickZoom: true,
      touchZoom: true,
      minZoom: 2,
      maxZoom: 16,
      worldCopyJump: true,
    });
    mapInstanceRef.current = map;

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const tileLayer = L.tileLayer(isDark ? DARK_TILE_URL : TILE_URL, {
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
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

        renderRoutes(map, data, null);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("Failed to load travel route:", err);
        setLoading(false);
      });

    return () => {
      alive = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const data = rawDataRef.current;
    if (!map || data.length === 0) return;
    renderRoutes(map, data, selectedMonth);
  }, [selectedMonth, renderRoutes]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark === isDarkRef.current) return;
      isDarkRef.current = isDark;

      if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
      const newTile = L.tileLayer(isDark ? DARK_TILE_URL : TILE_URL, {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);
      tileLayerRef.current = newTile;

      if (rawDataRef.current.length > 0) {
        renderRoutes(map, rawDataRef.current, selectedMonth);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [selectedMonth, renderRoutes]);

  const handleYearClick = (year: string) => {
    if (selectedYear === year) {
      setSelectedYear(null);
      setSelectedMonth(null);
    } else {
      setSelectedYear(year);
      setSelectedMonth(null);
    }
  };

  const handleMonthClick = (month: MonthInfo) => {
    if (selectedMonth?.key === month.key) {
      setSelectedMonth(null);
    } else {
      setSelectedMonth(month);
    }
  };

  const handleReset = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
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

  return (
    <div className={`relative ${className || ""}`}>
      <div
        ref={mapRef}
        className="w-full h-[360px] md:h-[480px] rounded-2xl overflow-hidden border border-warm-200/40 dark:border-gray-800/40"
      />

      {!loading && availableMonths.length > 0 && (
        <div className="absolute top-3 left-3 z-[1000]">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl shadow-lg shadow-black/10 border border-warm-200/50 dark:border-gray-700/50 p-3 w-[180px] md:w-[200px]">
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
                  onClick={() => { setSelectedYear(null); setSelectedMonth(null); }}
                  className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-2 flex items-center gap-0.5 transition-colors"
                >
                  {"← 返回"}
                </button>
                <div className="flex flex-wrap gap-1">
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
      )}

      {!loading && selectedMonth && (
        <div className="absolute top-3 right-3 z-[1000]">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg shadow-lg shadow-black/10 border border-warm-200/50 dark:border-gray-700/50 px-3 py-2">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {selectedMonth.label} 我的轨迹
            </div>
            {stats.points > 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {stats.points.toLocaleString()} 个点 · {stats.distance.toLocaleString()} km
                {animating ? (
                  <span className="ml-1.5 inline-block text-forest-500 animate-pulse">▸ 回放中</span>
                ) : (
                  <button
                    onClick={replayRoute}
                    className="ml-1.5 text-forest-500 hover:text-forest-600 dark:text-forest-400 dark:hover:text-forest-300 underline underline-offset-2 transition-colors"
                  >
                    再次回放
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">这个月没有轨迹数据 🫠</div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-warm-50/80 dark:bg-gray-900/80 rounded-2xl pointer-events-none">
          <div className="text-center">
            <div className="animate-float text-3xl mb-2">🌍</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-hand">加载轨迹中...</div>
          </div>
        </div>
      )}

      {!loading && stats.points > 0 && !selectedMonth && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm">
          {Object.entries(YEAR_COLORS).map(([year, color]) => (
            <div key={year} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-gray-500 dark:text-gray-400">{year}</span>
            </div>
          ))}
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span className="text-gray-500 dark:text-gray-400">
            <span className="font-mono text-forest-600 dark:text-forest-400">{stats.points.toLocaleString()}</span> 个轨迹点
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            <span className="font-mono text-sunset-500">{stats.distance.toLocaleString()}</span> km
          </span>
        </div>
      )}
    </div>
  );
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
