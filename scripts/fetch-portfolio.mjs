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

  const ctx = TradeContext.new(config);
  const quoteCtx = QuoteContext.new(config);

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
          quoteMap[q.symbol] = {
            lastDone: Number(q.lastDone) || 0,
            prevClose: Number(q.prevClose) || 0,
            changeRate: Number(q.changeRate) || 0,
          };
        }
      } catch (e) {
        console.error("  Quote fetch failed:", e.message);
      }
    }

    positions = allPositions.map((p) => {
      const pos = {
        symbol: p.symbol,
        name: p.symbolName || p.symbol.split(".")[0],
        quantity: Number(p.quantity) || 0,
        availableQuantity: Number(p.availableQuantity) || 0,
        currency: p.currency || "HKD",
        costPrice: Number(p.costPrice) || 0,
        marketVal: quoteMap[p.symbol]
          ? Number(p.quantity) * quoteMap[p.symbol].lastDone
          : Number(p.quantity) * Number(p.costPrice) || 0,
        unrealizedPnl: quoteMap[p.symbol]
          ? (quoteMap[p.symbol].lastDone - Number(p.costPrice)) * Number(p.quantity)
          : 0,
        lastDone: quoteMap[p.symbol]?.lastDone || 0,
        changeRate: quoteMap[p.symbol]?.changeRate || 0,
        marketValInHKD: 0,
        unrealizedPnlInHKD: 0,
        percentageOfPortfolio: 0,
      };
      pos.marketValInHKD = marketValInHKD(pos, usdHkdRate);
      pos.unrealizedPnlInHKD = unrealizedPnlInHKD(pos, usdHkdRate);
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
