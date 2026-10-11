import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  contributionStart,
  contributionWeeks as weeks,
  contributionYears,
  topRepoNames,
  weekTopRepo,
} from "@/data/contributions";
import { summits } from "@/data/works";

// 五年的每周贡献数画成一条山脊线，像徒步路线的海拔剖面图。
// 高度按平方根缩放，鼠标、手指或方向键可以逐周查看。

const WEEK = 7 * 24 * 60 * 60 * 1000;
const startMs = Date.parse(`${contributionStart}T00:00:00Z`);
const maxValue = Math.max(...weeks);
const peakIndex = weeks.indexOf(maxValue);
const CONTOURS = [10, 50, 150];

const fmt = (n: number) => n.toLocaleString("en-US");

function weekLabel(i: number) {
  const d = new Date(startMs + i * WEEK);
  return `${d.getUTCFullYear()} 年 ${d.getUTCMonth() + 1} 月 ${d.getUTCDate()} 日那周`;
}

function indexOfDate(iso: string) {
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - startMs) / WEEK);
}

const summitAt = new Map(summits.map((s) => [indexOfDate(s.date), s]));

function describe(i: number) {
  const v = weeks[i];
  const head = `${weekLabel(i)}：`;
  if (v === 0) return { head, count: null as number | null, tail: "没有公开的贡献。" };
  const s = summitAt.get(i);
  if (s) return { head, count: v, tail: `，${s.note}。` };
  const r = weekTopRepo[i];
  if (r >= 0) return { head, count: v, tail: `，提交最多的是 ${topRepoNames[r]}。` };
  if (r === -2) return { head, count: v, tail: "，大多是这一页没收录的笔记和个人仓库。" };
  return { head, count: v, tail: "，没有对应的公开提交，可能是 PR、issue 或私有仓库。" };
}

function describeText(i: number) {
  const d = describe(i);
  return d.head + (d.count === null ? "" : `${fmt(d.count)} 次贡献`) + d.tail;
}

// 估算 12px 标签的宽度，只用来判断标签会不会挤在一起，宁可估宽一点
function labelWidth(text: string) {
  let w = 0;
  for (const ch of text) w += /[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 12.5 : 7.5;
  return w;
}

export default function ContributionRidge() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = weeks.length;
  const height = width > 0 && width < 560 ? 196 : 244;
  const padTop = 38;
  const padBottom = 52;
  const plotH = height - padTop - padBottom;
  const baseY = padTop + plotH;

  const geo = useMemo(() => {
    if (!width) return null;
    const x = (i: number) => (i / (n - 1)) * width;
    const y = (v: number) => padTop + plotH * (1 - Math.sqrt(v / maxValue));

    let line = "";
    weeks.forEach((v, i) => {
      line += `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    });
    const area = `${line}L${width},${baseY}L0,${baseY}Z`;

    // 按优先级放山峰标签，和已经放下的标签挤在一起就跳过
    const placed: [number, number][] = [];
    const labels: {
      date: string;
      label: string;
      px: number;
      py: number;
      tx: number;
      anchor: "start" | "middle" | "end";
      labelY: number;
    }[] = [];
    for (const s of summits) {
      const i = indexOfDate(s.date);
      if (i < 0 || i >= n) continue;
      const px = x(i);
      const py = y(weeks[i]);
      const w = labelWidth(s.label);
      // 靠边的标签改成左对齐或右对齐，保证不会伸出图外
      let left = px - w / 2;
      let tx = px;
      let anchor: "start" | "middle" | "end" = "middle";
      if (left < 0) {
        left = 0;
        tx = 0;
        anchor = "start";
      } else if (left + w > width) {
        left = width - w;
        tx = width;
        anchor = "end";
      }
      if (placed.some(([a, b]) => left < b + 12 && left + w > a - 12)) continue;
      const i0 = Math.max(0, Math.floor((left / width) * (n - 1)));
      const i1 = Math.min(n - 1, Math.ceil(((left + w) / width) * (n - 1)));
      let top = py;
      for (let k = i0; k <= i1; k++) top = Math.min(top, y(weeks[k]));
      placed.push([left, left + w]);
      labels.push({ date: s.date, label: s.label, px, py, tx, anchor, labelY: Math.max(13, top - 15) });
    }

    const years = contributionYears.map(({ year, total }) => ({
      year,
      total,
      tx: Math.max(0, x((Date.UTC(year, 0, 1) - startMs) / WEEK)),
    }));
    const contours = CONTOURS.filter((v) => v < maxValue).map((v) => ({ v, cy: y(v) }));
    return { x, y, line, area, labels, years, contours };
  }, [width, n, plotH, baseY]);

  const indexAt = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width) return null;
    const t = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
    return Math.round(t * (n - 1));
  };

  const onPointer = (e: PointerEvent<HTMLDivElement>) => {
    const i = indexAt(e.clientX);
    if (i !== null) setActive(i);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const cur = active ?? peakIndex;
    let next: number;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next = cur - 1;
        break;
      case "ArrowRight":
      case "ArrowUp":
        next = cur + 1;
        break;
      case "PageDown":
        next = cur - 4;
        break;
      case "PageUp":
        next = cur + 4;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = n - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    setActive(Math.min(Math.max(next, 0), n - 1));
  };

  const shown = active ?? peakIndex;
  const d = active === null ? null : describe(active);

  return (
    <div>
      <div
        ref={wrapRef}
        role="slider"
        tabIndex={0}
        aria-label="五年来每周的 GitHub 贡献数"
        aria-valuemin={0}
        aria-valuemax={n - 1}
        aria-valuenow={shown}
        aria-valuetext={describeText(shown)}
        onPointerDown={onPointer}
        onPointerMove={onPointer}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setActive(null);
        }}
        onFocus={() => {
          if (active === null) setActive(peakIndex);
        }}
        onKeyDown={onKeyDown}
        className="relative cursor-crosshair select-none touch-pan-y rounded-md outline-none focus-visible:ring-2 focus-visible:ring-forest-500/60 focus-visible:ring-offset-8 focus-visible:ring-offset-cream dark:focus-visible:ring-offset-gray-950"
        style={{ height }}
      >
        {geo && (
          <svg width={width} height={height} className="block overflow-visible" aria-hidden="true">
            {geo.contours.map(({ v, cy }, k) => (
              <g key={v}>
                <line
                  x1={0}
                  x2={width}
                  y1={cy}
                  y2={cy}
                  className="stroke-warm-300/60 dark:stroke-gray-700/70"
                  strokeDasharray="1 5"
                  strokeLinecap="round"
                />
                <text x={0} y={cy - 5} fontSize={11} className="font-digits fill-gray-400 dark:fill-gray-500">
                  {k === geo.contours.length - 1 ? `${v} 次/周` : v}
                </text>
              </g>
            ))}

            <motion.path
              d={geo.area}
              className="fill-forest-500/10 dark:fill-forest-400/10"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            />
            <motion.path
              d={geo.line}
              fill="none"
              strokeWidth={1.5}
              strokeLinejoin="round"
              className="stroke-forest-600 dark:stroke-forest-400"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
            />
            <line x1={0} x2={width} y1={baseY} y2={baseY} className="stroke-coffee/30 dark:stroke-warm-300/25" />

            {geo.years.map(({ year, total, tx }) => (
              <g key={year}>
                <line x1={tx} x2={tx} y1={baseY} y2={baseY + 8} className="stroke-coffee/40 dark:stroke-warm-300/40" />
                <text x={tx + 5} y={baseY + 20} fontSize={11} className="fill-gray-500 dark:fill-gray-400">
                  {year}
                </text>
                <text x={tx + 5} y={baseY + 41} fontSize={17} className="font-digits fill-coffee dark:fill-warm-300">
                  {fmt(total)}
                </text>
              </g>
            ))}

            <motion.g
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
            >
              {geo.labels.map((l) => (
                <g key={l.date}>
                  <path
                    d={`M${(l.px - 4.5).toFixed(1)},${(l.py - 2).toFixed(1)}L${l.px.toFixed(1)},${(l.py - 10).toFixed(1)}L${(l.px + 4.5).toFixed(1)},${(l.py - 2).toFixed(1)}Z`}
                    className="fill-sunset-500 dark:fill-sunset-400"
                  />
                  {l.labelY < l.py - 28 && (
                    <line
                      x1={l.px}
                      x2={l.px}
                      y1={l.labelY + 5}
                      y2={l.py - 12}
                      className="stroke-sunset-400/70"
                      strokeDasharray="1 3"
                      strokeLinecap="round"
                    />
                  )}
                  <text x={l.tx} y={l.labelY} textAnchor={l.anchor} fontSize={12} className="fill-coffee dark:fill-warm-300">
                    {l.label}
                  </text>
                </g>
              ))}
            </motion.g>

            {active !== null && (
              <g>
                <line
                  x1={geo.x(active)}
                  x2={geo.x(active)}
                  y1={padTop - 10}
                  y2={baseY}
                  className="stroke-gray-400/70 dark:stroke-gray-500/70"
                />
                <circle
                  cx={geo.x(active)}
                  cy={geo.y(weeks[active])}
                  r={4.5}
                  strokeWidth={2}
                  className="fill-sunset-500 stroke-cream dark:stroke-gray-950"
                />
              </g>
            )}
          </svg>
        )}
      </div>

      <p className="mt-3 min-h-[3.4em] text-gray-600 dark:text-gray-400 leading-relaxed">
        {d === null ? (
          "把鼠标放到山脊上，看看那一周在忙什么。手机上点一下就行。"
        ) : (
          <>
            {d.head}
            {d.count !== null && (
              <>
                <span className="font-digits text-lg text-gray-900 dark:text-gray-100">{fmt(d.count)}</span> 次贡献
              </>
            )}
            {d.tail}
          </>
        )}
      </p>
    </div>
  );
}
