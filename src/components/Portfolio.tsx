import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

interface Position {
  symbol: string;
  name: string;
  quantity: number;
  currency: string;
  costPrice: number;
  marketVal: number;
  unrealizedPnl: number;
  realizedPnl: number;
  lastDone: number;
  prevClose: number;
  changeRate: number;
  dailyPnl: number;
  dailyPnlPercent: number;
  marketValInHKD: number;
  unrealizedPnlInHKD: number;
  dailyPnlInHKD: number;
  percentageOfPortfolio: number;
  session?: string;
}

interface PortfolioData {
  updatedAt: string;
  fetched: boolean;
  usdHkdRate: number;
  balance: {
    totalCash: number;
    netAssets: number;
    marketVal: number;
    currency: string;
  } | null;
  positions: Position[];
}

const PIE_COLORS = [
  "#2d6a4f",
  "#e76f51",
  "#457b9d",
  "#e9c46a",
  "#f4a261",
  "#264653",
  "#2a9d8f",
  "#d62828",
  "#6a4c93",
  "#1982c4",
  "#8ac926",
  "#ff595e",
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function PieChart({ positions, hovered, onHover }: { positions: Position[]; hovered: number | null; onHover: (i: number | null) => void }) {
  const cx = 100;
  const cy = 100;
  const r = 90;
  const innerR = 55;
  let currentAngle = 0;

  const total = positions.reduce((s, p) => s + p.marketValInHKD, 0);

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full max-w-[260px] mx-auto">
      {positions.map((pos, i) => {
        const pct = total > 0 ? (pos.marketValInHKD / total) * 100 : 0;
        const angle = (pct / 100) * 360;
        const isHovered = hovered === i;

        const outerR = isHovered ? r + 6 : r;
        const startAngle = currentAngle;
        currentAngle += angle;

        return (
          <g key={pos.symbol} onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)} style={{ cursor: "pointer" }}>
            <path
              d={describeArc(cx, cy, outerR, startAngle, startAngle + angle - 0.5)}
              fill={PIE_COLORS[i % PIE_COLORS.length]}
              opacity={hovered !== null && hovered !== i ? 0.4 : 1}
              style={{ transition: "all 0.2s ease" }}
            />
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={innerR} fill="white" className="dark:fill-gray-950" />

      {hovered !== null && hovered < positions.length ? (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" className="fill-gray-900 dark:fill-gray-100" fontSize="12" fontWeight="bold" style={{ fontFamily: '"Smiley Sans", sans-serif' }}>
            {positions[hovered].symbol.split(".")[0]}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400" fontSize="10" style={{ fontFamily: '"Smiley Sans", sans-serif' }}>
            {positions[hovered].percentageOfPortfolio.toFixed(1)}%
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400" fontSize="8" style={{ fontFamily: '"Smiley Sans", sans-serif' }}>
            {positions.length} 只
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" className="fill-gray-900 dark:fill-gray-100" fontSize="10" fontWeight="bold">
            持仓
          </text>
        </>
      )}
    </svg>
  );
}

export default function Portfolio() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [lastFetch, setLastFetch] = useState<string>("");
  const [timeAgo, setTimeAgo] = useState("");

  const updateTimeAgo = (updatedAt: string) => {
    const now = Date.now();
    const diffMs = now - new Date(updatedAt).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) setTimeAgo("刚刚");
    else if (diffMin < 60) setTimeAgo(`${diffMin} 分钟前`);
    else {
      const diffHr = Math.floor(diffMin / 60);
      setTimeAgo(`${diffHr} 小时前`);
    }
  };

  const fetchData = () => {
    fetch("https://raw.githubusercontent.com/yanboishere/yanboishere.github.io/master/public/portfolio.json")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        updateTimeAgo(d.updatedAt);
        setLastFetch(new Date().toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
        setLoading(false);
      })
      .catch(() => {
        fetch("/portfolio.json")
          .then((r) => r.json())
          .then((d) => {
            setData(d);
            updateTimeAgo(d.updatedAt);
            setLastFetch(new Date().toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data?.updatedAt) return;
    const timer = setInterval(() => updateTimeAgo(data.updatedAt), 30000);
    return () => clearInterval(timer);
  }, [data?.updatedAt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 text-forest-500 animate-spin" />
      </div>
    );
  }

  if (!data || !data.fetched || data.positions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">持仓数据待更新</p>
      </div>
    );
  }

  const totalMarketValHKD = data.positions.reduce((s, p) => s + p.marketValInHKD, 0);
  const totalUnrealizedPnlHKD = data.positions.reduce((s, p) => s + p.unrealizedPnlInHKD, 0);
  const totalDailyPnlHKD = data.positions.reduce((s, p) => s + (p.dailyPnlInHKD || 0), 0);
  const pnlPositive = totalUnrealizedPnlHKD >= 0;
  const dailyPnlPositive = totalDailyPnlHKD >= 0;

  const currencySymbol = (currency: string) => {
    if (currency === "HKD") return "HK$";
    if (currency === "USD") return "US$";
    return currency + " ";
  };

  const formatCurrency = (val: number, currency: string = "HKD") => {
    const abs = Math.abs(val);
    return `${val < 0 ? "-" : ""}${currencySymbol(currency)}${new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(abs)}`;
  };

  const formatPnl = (val: number, currency?: string) =>
    `${val > 0 ? "+" : ""}${currency ? currencySymbol(currency) : ""}${new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val)}`;

  const formatPercent = (cost: number, quantity: number, lastDone: number) => {
    if (!cost || !quantity || !lastDone) return null;
    if (cost < 0) return null;
    const pnl = (lastDone - cost) * quantity;
    const base = cost * quantity;
    if (!base) return null;
    const pct = (pnl / base) * 100;
    return `${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`;
  };

  const displayPositions = expanded ? data.positions : data.positions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "持仓市值 (HKD)", value: formatCurrency(totalMarketValHKD, "HKD"), color: "text-gray-900 dark:text-gray-100" },
          { label: "未实现盈亏 (HKD)", value: formatPnl(totalUnrealizedPnlHKD, "HKD"), color: pnlPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400" },
          { label: "今日盈亏 (HKD)", value: formatPnl(totalDailyPnlHKD, "HKD"), color: dailyPnlPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400" },
          { label: "持仓数量", value: `${data.positions.length} 只`, color: "text-gray-900 dark:text-gray-100" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
            <p className={`text-lg font-smiley font-bold ${card.color}`}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-6 items-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <PieChart positions={data.positions} hovered={hoveredIdx} onHover={setHoveredIdx} />
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {data.positions.slice(0, 5).map((pos, i) => (
              <div key={pos.symbol} className="flex items-center gap-1.5 cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-smiley">{pos.symbol.split(".")[0]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-2">
          {displayPositions.map((pos, idx) => (
            <motion.div
              key={pos.symbol}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 + 0.2 }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`bg-white dark:bg-gray-800/50 border rounded-xl p-3.5 transition-all duration-200 ${
                hoveredIdx === idx
                  ? "border-forest-400 dark:border-forest-500 shadow-sm"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-gray-900 dark:text-gray-100 text-sm truncate">
                        {pos.name}
                      </h4>
                      <span className="text-xs text-gray-400 font-smiley flex-shrink-0">{pos.symbol}</span>
                      {pos.session === "pre" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">盘前</span>}
                      {pos.session === "post" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">盘后</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <span className="font-smiley">{pos.quantity} 股</span>
                      <span>成本 <span className="font-smiley">{currencySymbol(pos.currency)}{pos.costPrice?.toFixed(2)}</span></span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="font-smiley font-bold text-gray-900 dark:text-gray-100 text-sm">
                    {formatCurrency(pos.marketVal, pos.currency)}
                  </p>
                  <p className={`text-xs font-smiley ${pos.unrealizedPnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatPnl(pos.unrealizedPnl, pos.currency)} {formatPercent(pos.costPrice, pos.quantity, pos.lastDone) ? `(${formatPercent(pos.costPrice, pos.quantity, pos.lastDone)})` : ""}
                  </p>
                  {pos.costPrice < 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                      负成本 = 已通过减仓/分红收回成本，剩余为纯利润
                    </p>
                  )}
                  {pos.dailyPnl != null && (
                    <p className={`text-[11px] font-smiley ${pos.dailyPnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      今日 {formatPnl(pos.dailyPnl, pos.currency)} ({pos.dailyPnlPercent > 0 ? "+" : ""}{pos.dailyPnlPercent?.toFixed(2)}%)
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pos.percentageOfPortfolio, 1)}%` }}
                  transition={{ delay: idx * 0.05 + 0.4, duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {data.positions.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-forest-600 dark:hover:text-forest-400 transition-colors"
        >
          {expanded ? <>收起 <ChevronUp className="w-4 h-4" /></> : <>展开全部 {data.positions.length} 只 <ChevronDown className="w-4 h-4" /></>}
        </button>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
        {(() => {
          const diffMin = Math.floor((Date.now() - new Date(data.updatedAt).getTime()) / 60000);
          const isStale = diffMin > 10;
          const absTime = new Date(data.updatedAt).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
          return (
            <>
              {isStale && <span className="text-amber-500 dark:text-amber-400 mr-1">⚠ 数据更新可能异常</span>}
              数据更新于 {timeAgo}（{absTime}）{isStale ? "" : " · 更新正常 ✓"}
            </>
          );
        })()}
        {" · 每分钟检查 · 汇率 USD/HKD "}{data.usdHkdRate?.toFixed(4)}
      </p>
    </div>
  );
}
