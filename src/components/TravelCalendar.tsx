import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

type RawPoint = [number, number, number];

interface DayData {
  date: string;
  distance: number;
  points: number;
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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function getColorLevel(distance: number, maxDist: number): number {
  if (distance === 0) return 0;
  if (maxDist === 0) return 0;
  const ratio = distance / maxDist;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const LEVEL_COLORS_INLINE = [
  "",
  "#9be9a8",
  "#40c463",
  "#30a14e",
  "#216e39",
];

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export default function TravelCalendar() {
  const [rawData, setRawData] = useState<RawPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch("/travel-route.json")
      .then((res) => res.json())
      .then((data: RawPoint[]) => {
        setRawData(data);
        const dates = data.map((p) => {
          const d = new Date(p[2] * 1000);
          return { year: d.getFullYear(), month: d.getMonth() + 1 };
        });
        const sorted = dates.sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month));
        const latest = sorted[sorted.length - 1];
        if (latest) {
          setSelectedYear(latest.year);
          setSelectedMonth(latest.month);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const p of rawData) {
      years.add(new Date(p[2] * 1000).getFullYear());
    }
    return Array.from(years).sort();
  }, [rawData]);

  const dailyData = useMemo(() => {
    const map = new Map<string, { distance: number; points: number }>();

    const sorted = [...rawData].sort((a, b) => a[2] - b[2]);

    for (let i = 0; i < sorted.length; i++) {
      const d = new Date(sorted[i][2] * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { distance: 0, points: 0 });
      const entry = map.get(key)!;
      entry.points++;

      if (i > 0) {
        const prevD = new Date(sorted[i - 1][2] * 1000);
        const prevKey = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, "0")}-${String(prevD.getDate()).padStart(2, "0")}`;
        if (prevKey === key) {
          entry.distance += haversineKm(sorted[i - 1][0], sorted[i - 1][1], sorted[i][0], sorted[i][1]);
        }
      }
    }
    return map;
  }, [rawData]);

  const monthDays = useMemo((): DayData[] => {
    if (!selectedYear || !selectedMonth) return [];
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const days: DayData[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const entry = dailyData.get(key);
      days.push({
        date: key,
        distance: entry ? Math.round(entry.distance) : 0,
        points: entry ? entry.points : 0,
      });
    }
    return days;
  }, [selectedYear, selectedMonth, dailyData]);

  const maxDist = useMemo(() => {
    return Math.max(...monthDays.map((d) => d.distance), 1);
  }, [monthDays]);

  const monthStats = useMemo(() => {
    const totalDist = monthDays.reduce((s, d) => s + d.distance, 0);
    const totalPoints = monthDays.reduce((s, d) => s + d.points, 0);
    const activeDays = monthDays.filter((d) => d.distance > 0).length;
    return { totalDist, totalPoints, activeDays };
  }, [monthDays]);

  const firstDayOffset = useMemo(() => {
    return getFirstDayOfWeek(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const handlePrevMonth = useCallback(() => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  }, [selectedMonth]);

  const handleNextMonth = useCallback(() => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  }, [selectedMonth]);

  const handleDayHover = useCallback((day: DayData, e: React.MouseEvent) => {
    setHoveredDay(day);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-float text-3xl mb-2">📅</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 font-hand">加载日历数据...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-lg font-display font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-forest-600 dark:hover:text-forest-400 transition-colors outline-none"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-lg font-display font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-forest-600 dark:hover:text-forest-400 transition-colors outline-none"
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-warm-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {monthDays.map((day) => {
              const level = getColorLevel(day.distance, maxDist);
              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (Number(day.date.split("-")[2]) - 1) * 0.015, duration: 0.2 }}
                  className="aspect-square rounded-sm cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-forest-400 dark:hover:ring-forest-500 hover:ring-offset-1 dark:hover:ring-offset-gray-900 relative group"
                  style={{
                    backgroundColor: level > 0 ? LEVEL_COLORS_INLINE[level] : undefined,
                    opacity: level > 0 ? 1 : undefined,
                  }}
                  onMouseEnter={(e) => handleDayHover(day, e)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {level === 0 && (
                    <div className="absolute inset-0 rounded-sm border border-gray-200/60 dark:border-gray-700/60" />
                  )}
                  <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-mono ${
                    level >= 3 ? "text-white/90" : level > 0 ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"
                  }`}>
                    {Number(day.date.split("-")[2])}
                  </span>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-1.5 mt-3 text-[11px] text-gray-400 dark:text-gray-500">
            <span>少</span>
            {LEVEL_COLORS_INLINE.map((color, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: i === 0 ? undefined : color }}
              >
                {i === 0 && <div className="w-full h-full rounded-sm border border-gray-200/60 dark:border-gray-700/60" />}
              </div>
            ))}
            <span>多</span>
          </div>
        </div>

        <div className="md:w-44 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedYear}-${selectedMonth}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-warm-50/80 dark:bg-gray-800/50 rounded-xl p-4 border border-warm-200/40 dark:border-gray-700/40"
            >
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-forest-500" />
                <span className="text-sm font-display font-bold text-gray-800 dark:text-gray-200">
                  {selectedMonth}月概览
                </span>
              </div>
              <div className="space-y-2.5">
                <div>
                  <div className="text-2xl font-mono font-bold text-forest-600 dark:text-forest-400">
                    {monthStats.totalDist.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">km</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">总行程</div>
                </div>
                <div className="h-px bg-warm-200/50 dark:bg-gray-700/50" />
                <div className="flex justify-between">
                  <div>
                    <div className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200">
                      {monthStats.activeDays}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">活跃天数</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200">
                      {monthStats.totalPoints.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">GPS点数</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-800 text-white text-xs shadow-xl pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-medium">{hoveredDay.date}</div>
            {hoveredDay.distance > 0 ? (
              <>
                <div className="text-forest-300 font-mono">{hoveredDay.distance} km</div>
                <div className="text-gray-400">{hoveredDay.points.toLocaleString()} 个点</div>
              </>
            ) : (
              <div className="text-gray-400">没有轨迹数据</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
