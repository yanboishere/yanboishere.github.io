import { Config, OAuth, TradeContext } from "longbridge";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_ID = "95787fee-4347-44e5-807c-720465da7bad";

async function buildConfig() {
  const { LONGBRIDGE_APP_KEY, LONGBRIDGE_APP_SECRET, LONGBRIDGE_ACCESS_TOKEN } = process.env;
  if (LONGBRIDGE_APP_KEY && LONGBRIDGE_APP_SECRET && LONGBRIDGE_ACCESS_TOKEN) {
    console.log("Using API Key authentication");
    return Config.fromApikeyEnv();
  }

  const oauth = await OAuth.build(CLIENT_ID, () => {});
  console.log("Using OAuth authentication");
  return Config.fromOAuth(oauth);
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function dec(v) {
  return Number(v?.toString?.() ?? v ?? 0);
}

async function main() {
  const config = await buildConfig();
  const ctx = TradeContext.new(config);

  const endAt = new Date();
  const startAt = new Date();
  startAt.setDate(startAt.getDate() - 90);

  console.log(`Fetching trades from ${fmtDate(startAt)} to ${fmtDate(endAt)}...\n`);

  const [executions, orders, balances, positions] = await Promise.all([
    ctx.historyExecutions({ startAt, endAt }),
    ctx.historyOrders({ startAt, endAt }),
    ctx.accountBalance(),
    ctx.stockPositions(),
  ]);

  const execData = executions.map((e) => ({
    orderId: e.orderId,
    tradeId: e.tradeId,
    symbol: e.symbol,
    tradeDoneAt: e.tradeDoneAt.toISOString(),
    quantity: dec(e.quantity),
    price: dec(e.price),
    amount: dec(e.quantity) * dec(e.price),
  }));

  const orderData = orders.map((o) => ({
    orderId: o.orderId,
    symbol: o.symbol,
    side: o.side?.toString?.() ?? String(o.side),
    status: o.status?.toString?.() ?? String(o.status),
    submittedAt: o.submittedAt?.toISOString?.() ?? null,
    updatedAt: o.updatedAt?.toISOString?.() ?? null,
    quantity: dec(o.quantity),
    executedQuantity: dec(o.executedQuantity),
    submittedPrice: dec(o.submittedPrice),
    executedPrice: dec(o.executedPrice),
  }));

  const allPositions = positions.channels.flatMap((ch) => ch.positions || []);
  const posData = allPositions.map((p) => ({
    symbol: p.symbol,
    name: p.symbolName,
    quantity: dec(p.quantity),
    costPrice: dec(p.costPrice),
    currency: p.currency,
  }));

  const balData = balances.map((b) => ({
    currency: b.currency,
    totalCash: dec(b.totalCash),
    netAssets: dec(b.netAssets),
    availableCash: dec(b.availableCash),
  }));

  const output = {
    fetchedAt: new Date().toISOString(),
    period: { startAt: startAt.toISOString(), endAt: endAt.toISOString() },
    balance: balData,
    positions: posData,
    executions: execData.sort((a, b) => b.tradeDoneAt.localeCompare(a.tradeDoneAt)),
    orders: orderData.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")),
  };

  const outFile = path.join(__dirname, "..", "public", "trades.json");
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`Saved ${execData.length} executions, ${orderData.length} orders`);
  console.log(`Output: ${outFile}`);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});