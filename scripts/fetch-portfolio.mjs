import { Config, OAuth, TradeContext, QuoteContext } from "longbridge";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, "..", "public", "portfolio.json");

const CLIENT_ID = "95787fee-4347-44e5-807c-720465da7bad";
const APP_KEY = process.env.LONGBRIDGE_APP_KEY;
const APP_SECRET = process.env.LONGBRIDGE_APP_SECRET;
const ACCESS_TOKEN = process.env.LONGBRIDGE_ACCESS_TOKEN;

async function buildConfig() {
  if (APP_KEY && APP_SECRET && ACCESS_TOKEN) {
    console.log("Using API Key authentication");
    return Config.fromApikeyEnv();
  }

  try {
    const oauth = await OAuth.build(CLIENT_ID, () => {});
    console.log("Using OAuth authentication");
    return Config.fromOAuth(oauth);
  } catch (e) {
    console.warn("OAuth failed:", e.message);
    throw new Error("No valid authentication method available. Run auth-longbridge.mjs first.");
  }
}

async function fetchExchangeRate(quoteCtx) {
  try {
    const quotes = await quoteCtx.quote(["USD.HKD"]);
    if (quotes.length > 0) {
      const rate = Number(quotes[0].lastDone);
      if (rate > 0) {
        console.log(`  USD/HKD rate: ${rate} ✓`);
        return rate;
      }
    }
  } catch {}

  try {
    const resp = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await resp.json();
    if (data.rates?.HKD) {
      console.log(`  USD/HKD rate (fallback): ${data.rates.HKD} ✓`);
      return data.rates.HKD;
    }
  } catch {}

  console.warn("  Could not fetch USD/HKD rate, using default 7.8");
  return 7.8;
}

function marketValInHKD(pos, usdHkdRate) {
  const val = pos.marketVal;
  if (pos.currency === "USD") return val * usdHkdRate;
  return val;
}

function unrealizedPnlInHKD(pos, usdHkdRate) {
  const val = pos.unrealizedPnl;
  if (pos.currency === "USD") return val * usdHkdRate;
  return val;
}

async function main() {
  console.log("Fetching Longbridge portfolio...\n");

  let config;
  try {
    config = await buildConfig();
  } catch (e) {
    console.warn(e.message);
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log("Using existing portfolio.json");
    } else {
      const empty = { updatedAt: new Date().toISOString(), balance: null, positions: [], fetched: false };
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(empty, null, 2));
    }
    return;
  }

  let ctx, quoteCtx;
  try {
    ctx = TradeContext.new(config);
    quoteCtx = QuoteContext.new(config);
  } catch (e) {
    console.error("Failed to create contexts:", e.message);
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log("Using existing portfolio.json");
    } else {
      const empty = { updatedAt: new Date().toISOString(), balance: null, positions: [], fetched: false };
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(empty, null, 2));
    }
    return;
  }

  const usdHkdRate = await fetchExchangeRate(quoteCtx);

  let balance = null;
  try {
    const balances = await ctx.accountBalance();
    const primary = balances[0];
    if (primary) {
      balance = {
        totalCash: Number(primary.totalCash) || 0,
        netAssets: Number(primary.netAssets) || 0,
        marketVal: Number(primary.marketVal) || 0,
        currency: primary.currency || "HKD",
        availableCash: Number(primary.availableCash) || 0,
        frozenCash: Number(primary.frozenCash) || 0,
      };
    }
    console.log("  Balance fetched ✓");
  } catch (e) {
    console.error("  Balance fetch failed:", e.message);
  }

  let positions = [];
  try {
    const stockPositions = await ctx.stockPositions();
    const allPositions = stockPositions.channels.flatMap((ch) => ch.positions || []);
    const symbols = allPositions.map((p) => p.symbol).filter(Boolean);

    let quoteMap = {};
    if (symbols.length > 0) {
      try {
        const quotes = await quoteCtx.quote(symbols);
        for (const q of quotes) {
          let lastDone = Number(q.lastDone) || 0;
          let prevClose = Number(q.prevClose) || 0;
          let sessionLabel = "main";

          const pmq = q.postMarketQuote;
          const preq = q.preMarketQuote;

          if (pmq && pmq.lastDone) {
            const pmLast = Number(pmq.lastDone) || 0;
            if (pmLast > 0) {
              lastDone = pmLast;
              prevClose = Number(pmq.prevClose) || prevClose;
              sessionLabel = "post";
            }
          } else if (preq && preq.lastDone) {
            const preLast = Number(preq.lastDone) || 0;
            if (preLast > 0) {
              lastDone = preLast;
              prevClose = Number(preq.prevClose) || prevClose;
              sessionLabel = "pre";
            }
          }

          const changeRate = prevClose > 0 ? ((lastDone - prevClose) / prevClose) * 100 : 0;

          quoteMap[q.symbol] = {
            lastDone,
            prevClose,
            changeRate: Number(changeRate.toFixed(4)),
            session: sessionLabel,
          };
        }
      } catch (e) {
        console.error("  Quote fetch failed:", e.message);
      }
    }

    positions = allPositions.map((p) => {
      const q = quoteMap[p.symbol] || {};
      const qty = Number(p.quantity) || 0;
      const cost = Number(p.costPrice) || 0;
      const last = q.lastDone || 0;
      const prev = q.prevClose || 0;
      const dailyPnl = prev > 0 ? (last - prev) * qty : 0;
      const dailyPnlPercent = prev > 0 ? ((last - prev) / prev) * 100 : 0;

      const pos = {
        symbol: p.symbol,
        name: p.symbolName || p.symbol.split(".")[0],
        quantity: qty,
        availableQuantity: Number(p.availableQuantity) || 0,
        currency: p.currency || "HKD",
        costPrice: cost,
        marketVal: last > 0 ? qty * last : qty * cost || 0,
        unrealizedPnl: last > 0 ? (last - cost) * qty : 0,
        lastDone: last,
        prevClose: prev,
        changeRate: q.changeRate || 0,
        session: q.session || "main",
        dailyPnl,
        dailyPnlPercent: Number(dailyPnlPercent.toFixed(4)),
        marketValInHKD: 0,
        unrealizedPnlInHKD: 0,
        dailyPnlInHKD: 0,
        percentageOfPortfolio: 0,
      };
      pos.marketValInHKD = marketValInHKD(pos, usdHkdRate);
      pos.unrealizedPnlInHKD = unrealizedPnlInHKD(pos, usdHkdRate);
      pos.dailyPnlInHKD = pos.currency === "USD" ? dailyPnl * usdHkdRate : dailyPnl;
      return pos;
    });

    const totalMarketValHKD = positions.reduce((sum, p) => sum + p.marketValInHKD, 0);
    for (const p of positions) {
      p.percentageOfPortfolio =
        totalMarketValHKD > 0
          ? Number(((p.marketValInHKD / totalMarketValHKD) * 100).toFixed(2))
          : 0;
    }

    positions.sort((a, b) => b.marketValInHKD - a.marketValInHKD);
    console.log(`  Positions fetched: ${positions.length} ✓`);
  } catch (e) {
    console.error("  Positions fetch failed:", e.message);
  }

  const output = {
    updatedAt: new Date().toISOString(),
    fetched: true,
    usdHkdRate,
    balance,
    positions,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nPortfolio saved to ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
