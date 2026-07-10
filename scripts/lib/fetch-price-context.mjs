import {
  Config,
  OAuth,
  QuoteContext,
  NaiveDate,
  Period,
  AdjustType,
  TradeSessions,
} from "longbridge";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isStockOrEtf } from "./pnl-fifo.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_ID = "95787fee-4347-44e5-807c-720465da7bad";
const CACHE_FILE = path.join(__dirname, "..", "..", "public", "price-cache-h1.json");

async function buildConfig() {
  const { LONGBRIDGE_APP_KEY, LONGBRIDGE_APP_SECRET, LONGBRIDGE_ACCESS_TOKEN } = process.env;
  if (LONGBRIDGE_APP_KEY && LONGBRIDGE_APP_SECRET && LONGBRIDGE_ACCESS_TOKEN) {
    return Config.fromApikeyEnv();
  }
  const oauth = await OAuth.build(CLIENT_ID, () => {});
  return Config.fromOAuth(oauth);
}

function toNaiveDate(iso) {
  const d = new Date(iso);
  return new NaiveDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

function dec(v) {
  return Number(v?.toString?.() ?? v ?? 0);
}

export function analyzePricePosition(tradePrice, candle) {
  if (!candle || tradePrice <= 0) {
    return { open: null, high: null, low: null, close: null, positionPct: null, comment: "无行情数据" };
  }

  const { open, high, low, close } = candle;
  const range = high - low;
  const positionPct = range > 0 ? ((tradePrice - low) / range) * 100 : 50;

  let comment = "";
  if (positionPct >= 85) comment = "成交于当日高位区间";
  else if (positionPct >= 60) comment = "成交于当日中高位";
  else if (positionPct >= 40) comment = "成交于当日中间区间";
  else if (positionPct >= 15) comment = "成交于当日中低位";
  else comment = "成交于当日低位区间";

  if (tradePrice >= high * 0.98) comment += "（接近最高价）";
  else if (tradePrice <= low * 1.02) comment += "（接近最低价）";

  return { open, high, low, close, positionPct: Number(positionPct.toFixed(1)), comment };
}

export async function fetchPriceCache(tradesData, options = {}) {
  const { force = false } = options;
  let cache = { fetchedAt: null, rates: { usdHkd: 7.84 }, prices: {} };

  if (!force && fs.existsSync(CACHE_FILE)) {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  }

  const pairs = new Set();
  for (const e of tradesData.executions) {
    if (!isStockOrEtf(e.symbol)) continue;
    const date = e.tradeDoneAt.slice(0, 10);
    pairs.add(`${e.symbol}|${date}`);
  }

  // Also fetch Jun 30 close for open positions
  const symbols = [...new Set(tradesData.executions.filter((e) => isStockOrEtf(e.symbol)).map((e) => e.symbol))];
  for (const sym of symbols) pairs.add(`${sym}|2026-06-30`);

  const missing = [...pairs].filter((k) => !cache.prices[k]);
  if (missing.length === 0) {
    console.log(`Price cache hit: ${Object.keys(cache.prices).length} entries`);
    return cache;
  }

  console.log(`Fetching ${missing.length} price entries...`);
  const config = await buildConfig();
  const quoteCtx = QuoteContext.new(config);

  try {
    const quotes = await quoteCtx.quote(["USD.HKD"]);
    if (quotes.length > 0 && dec(quotes[0].lastDone) > 0) {
      cache.rates.usdHkd = dec(quotes[0].lastDone);
    }
  } catch {}

  for (const key of missing) {
    const [symbol, dateStr] = key.split("|");
    const [y, m, d] = dateStr.split("-").map(Number);
    const start = new NaiveDate(y, m, d);
    const end = new NaiveDate(y, m, d);

    try {
      const candles = await quoteCtx.historyCandlesticksByDate(
        symbol,
        Period.Day,
        AdjustType.NoAdjust,
        start,
        end,
        TradeSessions.All
      );

      if (candles.length > 0) {
        const c = candles[0];
        cache.prices[key] = {
          date: dateStr,
          open: dec(c.open),
          high: dec(c.high),
          low: dec(c.low),
          close: dec(c.close),
          volume: c.volume,
        };
      } else {
        cache.prices[key] = null;
      }
    } catch {
      cache.prices[key] = null;
    }

    await new Promise((r) => setTimeout(r, 50));
  }

  cache.fetchedAt = new Date().toISOString();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`Price cache saved: ${Object.keys(cache.prices).length} entries`);
  return cache;
}

export function getMarkPrices(cache, asOfDate = "2026-06-30") {
  const marks = {};
  for (const [key, candle] of Object.entries(cache.prices)) {
    const [symbol, date] = key.split("|");
    if (date === asOfDate && candle) {
      marks[symbol] = { close: candle.close, date };
    }
  }
  return marks;
}

export function attachPriceContext(trade, cache) {
  const date = trade.date.slice(0, 10);
  const key = `${trade.symbol}|${date}`;
  const candle = cache.prices[key];
  const ctx = analyzePricePosition(trade.price, candle);
  return { ...trade, priceContext: ctx };
}