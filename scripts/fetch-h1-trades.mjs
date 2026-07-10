import { Config, OAuth, TradeContext } from "longbridge";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_ID = "95787fee-4347-44e5-807c-720465da7bad";
const OUTPUT_FILE = path.join(__dirname, "..", "public", "trades-h1.json");

const START_AT = new Date("2026-01-01T00:00:00Z");
const END_AT = new Date("2026-06-30T23:59:59Z");

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

function dec(v) {
  return Number(v?.toString?.() ?? v ?? 0);
}

async function main() {
  console.log(`Fetching H1 trades ${START_AT.toISOString().slice(0, 10)} to ${END_AT.toISOString().slice(0, 10)}...\n`);

  const config = await buildConfig();
  const ctx = TradeContext.new(config);

  const [executions, orders, balances, cashFlows] = await Promise.all([
    ctx.historyExecutions({ startAt: START_AT, endAt: END_AT }),
    ctx.historyOrders({ startAt: START_AT, endAt: END_AT }),
    ctx.accountBalance(),
    ctx.cashFlow({ startAt: START_AT, endAt: END_AT }).catch(() => []),
  ]);

  const execData = executions
    .map((e) => ({
      orderId: e.orderId,
      tradeId: e.tradeId,
      symbol: e.symbol,
      tradeDoneAt: e.tradeDoneAt.toISOString(),
      quantity: dec(e.quantity),
      price: dec(e.price),
      amount: dec(e.quantity) * dec(e.price),
    }))
    .sort((a, b) => a.tradeDoneAt.localeCompare(b.tradeDoneAt));

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

  const balData = balances.map((b) => ({
    currency: b.currency,
    totalCash: dec(b.totalCash),
    netAssets: dec(b.netAssets),
    availableCash: dec(b.availableCash),
  }));

  const flowData = cashFlows.map((f) => ({
    name: f.transactionFlowName,
    direction: f.direction?.toString?.() ?? String(f.direction),
    businessType: f.businessType?.toString?.() ?? String(f.businessType),
    balance: dec(f.balance),
    currency: f.currency,
    businessTime: f.businessTime?.toISOString?.() ?? null,
    symbol: f.symbol,
    description: f.description,
  }));

  const output = {
    fetchedAt: new Date().toISOString(),
    period: { startAt: START_AT.toISOString(), endAt: END_AT.toISOString() },
    balance: balData,
    cashFlows: flowData,
    executions: execData,
    orders: orderData,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Saved ${execData.length} executions, ${orderData.length} orders, ${flowData.length} cash flows`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});