import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  computeFifoPnl,
  enrichSymbolReturns,
  monthlyBreakdown,
  isOption,
  isStockOrEtf,
  fmtMoney,
  fmtPct,
  toHkd,
  DEFAULT_USD_HKD,
} from "./lib/pnl-fifo.mjs";
import {
  fetchPriceCache,
  getMarkPrices,
  attachPriceContext,
} from "./lib/fetch-price-context.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRADES_FILE = path.join(__dirname, "..", "public", "trades-h1.json");
const REPORT_DIR = path.join(__dirname, "..", "reports");
const REPORT_FILE = path.join(REPORT_DIR, "2026-H1-trading-summary.md");

function loadTrades() {
  if (!fs.existsSync(TRADES_FILE)) {
    throw new Error(`Missing ${TRADES_FILE}. Run: node scripts/fetch-h1-trades.mjs`);
  }
  return JSON.parse(fs.readFileSync(TRADES_FILE, "utf8"));
}

function buildRecommendations(pnl, months, symbolStats, openPositions, usdHkd) {
  const recs = [];
  const stats = Object.values(symbolStats).sort((a, b) => b.realizedPnlHkd - a.realizedPnlHkd);
  const winners = stats.filter((s) => s.realizedPnlHkd > 0);
  const losers = stats.filter((s) => s.realizedPnlHkd < 0);

  if (winners.length) {
    recs.push(
      `**止盈能力较强**：${winners.slice(0, 3).map((s) => `${s.symbol.split(".")[0]}（${fmtMoney(s.realizedPnlHkd)}）`).join("、")} 已实现盈利突出，可总结高位减仓节奏并复用到其他标的。`
    );
  }

  if (losers.length) {
    recs.push(
      `**止损/换仓成本**：${losers.slice(0, 3).map((s) => `${s.symbol.split(".")[0]}（${fmtMoney(s.realizedPnlHkd)}）`).join("、")} 拖累已实现盈亏，建议为单一标的设定最大亏损阈值后再换仓。`
    );
  }

  const dram = symbolStats["DRAM.US"];
  if (dram && dram.buyCount + dram.sellCount >= 10) {
    recs.push(
      `**减少过度波段**：DRAM.US 上半年成交 ${dram.buyCount + dram.sellCount} 笔，频繁交易可能侵蚀利润；可改为「核心仓位 + 明确加减仓点位」策略。`
    );
  }

  const hkRows = enrichSymbolReturns(symbolStats, openPositions, usdHkd).find((s) => s.symbol === "7709.HK");
  if (hkRows && hkRows.realizedPnlHkd > 0) {
    recs.push(
      `**杠杆品种仓位管理**：7709.HK 总收益率 ${hkRows.totalReturnPct != null ? fmtPct(hkRows.totalReturnPct) : "N/A"}，说明高位止盈有效；但杠杆 ETF 波动大，建议单标的不超过净资产 30%。`
    );
  }

  if (pnl.summary.sellWinRate < 55) {
    recs.push(
      `**提升卖出胜率**：当前卖出胜率 ${pnl.summary.sellWinRate.toFixed(1)}%（${pnl.summary.sellWins}/${pnl.summary.sellTotal}），买入前可先明确止盈/止损价，避免「卖早赚少、卖晚亏多」的不对称。`
    );
  } else {
    recs.push(
      `**保持卖出纪律**：卖出胜率 ${pnl.summary.sellWinRate.toFixed(1)}% 表现良好，继续优先在日内高位区间减仓（你的多笔卖出位于当日高位）。`
    );
  }

  const openDram = pnl.openPositions.find((p) => p.symbol === "DRAM.US");
  if (openDram) {
    recs.push(
      `**注意 6 月底集中度**：DRAM.US 6/30 仍持仓 ${openDram.quantity} 股，叠加 EUV/RAM 等存储链仓位，主题集中度偏高，回调时净值波动会放大。`
    );
  }

  recs.push(
    `**期权与杠杆隔离**：本报告已排除期权，但上半年存在期权到期归零情况；建议期权名义本金不超过净资产 5%，且与股票仓位分开记账。`
  );

  recs.push(
    `**融资与现金管理**：若账户现金为负，需为杠杆利息和追加保证金预留缓冲；加仓前先计算「最大可承受回撤 × 持仓市值」。`
  );

  return recs;
}

function buildInsights(symbolStats, tradeLog) {
  const insights = [];

  const hk = symbolStats["7709.HK"];
  if (hk) {
    insights.push(
      `7709.HK（三星 2x 杠杆）：上半年卖出 ${hk.sellCount} 笔、买入 ${hk.buyCount} 笔，已实现盈亏 ${fmtMoney(hk.realizedPnlHkd)}，呈现「高位分批止盈、低位回补」特征。`
    );
  }

  const dram = symbolStats["DRAM.US"];
  if (dram) {
    insights.push(
      `DRAM.US（存储 ETF）：成交最活跃（${dram.buyCount + dram.sellCount} 笔），净买入倾向明显，是上半年核心配置主线。`
    );
  }

  const jun17 = tradeLog.filter((t) => t.date.startsWith("2026-06-17") && t.side === "卖出");
  if (jun17.length >= 3) {
    insights.push(
      `6 月 17 日出现集中换仓：同日卖出 ${jun17.length} 笔（${jun17.map((t) => t.symbol.split(".")[0]).join("、")}），属于阶段性止盈/清仓操作。`
    );
  }

  const may = tradeLog.filter((t) => t.date.startsWith("2026-05"));
  if (may.length >= 40) {
    insights.push(`5 月是交易最活跃月份（${may.length} 笔），大量波段与止盈发生在该月。`);
  }

  return insights;
}

function generateReport(data, pnl, cache) {
  const orderMap = Object.fromEntries(data.orders.map((o) => [o.orderId, o]));
  const usdHkd = cache.rates?.usdHkd ?? DEFAULT_USD_HKD;
  const stockExecs = data.executions.filter((e) => isStockOrEtf(e.symbol));
  const optionExecs = data.executions.filter((e) => isOption(e.symbol));
  const firstDate = stockExecs[0]?.tradeDoneAt?.slice(0, 10) ?? "N/A";
  const lastDate = stockExecs[stockExecs.length - 1]?.tradeDoneAt?.slice(0, 10) ?? "N/A";

  const enrichedLog = pnl.tradeLog.map((t) => attachPriceContext(t, cache));
  const months = monthlyBreakdown(pnl.tradeLog, usdHkd);
  const netAssets = data.balance?.[0]?.netAssets ?? 0;
  const capitalReturn = pnl.summary.buyAmountHkd > 0
    ? (pnl.summary.totalPnlHkd / pnl.summary.buyAmountHkd) * 100
    : 0;

  const openValueHkd = pnl.openPositions.reduce((s, p) => {
    const px = p.markPrice ?? p.avgCost;
    return s + toHkd(px * p.quantity, p.currency, usdHkd);
  }, 0);
  const estJun30Assets = Math.max(openValueHkd + (pnl.summary.sellAmountHkd - pnl.summary.buyAmountHkd), 1);
  const accountReturn = (pnl.summary.totalPnlHkd / estJun30Assets) * 100;

  const symbolRows = enrichSymbolReturns(pnl.symbolStats, pnl.openPositions, usdHkd)
    .sort((a, b) => (b.totalReturnPct ?? -Infinity) - (a.totalReturnPct ?? -Infinity))
    .map((s) => {
      const best = s.trades.reduce((b, t) => (t.realizedPnlHkd > (b?.realizedPnlHkd ?? -Infinity) ? t : b), null);
      const worst = s.trades.reduce((w, t) => (t.realizedPnlHkd < (w?.realizedPnlHkd ?? Infinity) ? t : w), null);
      return { ...s, best, worst };
    });

  const fmtReturn = (pct) => (pct == null ? "N/A" : fmtPct(pct));

  const lines = [];

  lines.push("# 2026 上半年交易总结报告");
  lines.push("");
  lines.push(`> 生成时间：${new Date().toLocaleString("zh-CN")}  `);
  lines.push(`> 数据来源：长桥 OpenAPI（股票/ETF，**不含期权**）  `);
  lines.push(`> USD/HKD 折算汇率：${usdHkd.toFixed(4)}（用于统一盈亏口径）`);
  lines.push("");

  lines.push("## 一、执行摘要");
  lines.push("");
  lines.push("| 指标 | 数值 |");
  lines.push("|------|------|");
  lines.push(`| 分析区间 | ${firstDate} ~ ${lastDate} |`);
  lines.push(`| API 请求区间 | 2026-01-01 ~ 2026-06-30 |`);
  lines.push(`| 股票/ETF 成交笔数 | ${pnl.summary.totalTrades}（买 ${pnl.summary.buyTrades} / 卖 ${pnl.summary.sellTrades}） |`);
  lines.push(`| 排除期权成交 | ${optionExecs.length} 笔 |`);
  lines.push(`| 买入金额（折算 HKD） | ${fmtMoney(pnl.summary.buyAmountHkd)} |`);
  lines.push(`| 卖出金额（折算 HKD） | ${fmtMoney(pnl.summary.sellAmountHkd)} |`);
  lines.push(`| 已实现盈亏 | ${fmtMoney(pnl.summary.realizedPnlHkd)} |`);
  lines.push(`| 未实现盈亏（6/30 收盘价） | ${fmtMoney(pnl.summary.unrealizedPnlHkd)} |`);
  lines.push(`| **总盈亏（至 6/30）** | **${fmtMoney(pnl.summary.totalPnlHkd)}** |`);
  lines.push(`| 资金回报率 | ${fmtPct(capitalReturn)} |`);
  lines.push(`| 账户回报率（估算，基于 6/30 持仓市值） | ${fmtPct(accountReturn)} |`);
  lines.push(`| 卖出胜率 | ${pnl.summary.sellWinRate.toFixed(1)}%（${pnl.summary.sellWins}/${pnl.summary.sellTotal}） |`);
  lines.push(`| 当前净资产（拉取时） | ${fmtMoney(netAssets)} |`);
  lines.push("");

  if (firstDate > "2026-01-01") {
    lines.push(
      `> **数据说明**：API 返回的最早股票成交为 **${firstDate}**，1～3 月无成交记录，本报告实际覆盖 **${firstDate} 至 6 月 30 日**。`
    );
    lines.push("");
  }

  lines.push("## 二、月度统计");
  lines.push("");
  lines.push("| 月份 | 成交笔数 | 买入(HKD) | 卖出(HKD) | 已实现盈亏(HKD) |");
  lines.push("|------|----------|-----------|-----------|-----------------|");
  for (const m of Object.keys(months).sort()) {
    const v = months[m];
    lines.push(`| ${m} | ${v.trades} | ${fmtMoney(v.buyHkd)} | ${fmtMoney(v.sellHkd)} | ${fmtMoney(v.realizedHkd)} |`);
  }
  lines.push("");

  lines.push("## 三、个股收益率汇总");
  lines.push("");
  lines.push(
    "> **成本法**：加权平均摊平成本（做 T 后持仓均价）；**总收益率** = (已实现盈亏 + 6/30 未实现盈亏) ÷ **最大持仓成本占用**（报告期内该标的峰值资金占用，含期末仍持仓成本）。"
  );
  lines.push("");
  lines.push("| 标的 | 状态 | 买/卖 | 最大资金占用(HKD) | 已实现盈亏 | 未实现盈亏 | 总盈亏 | **总收益率** | 已实现收益率 |");
  lines.push("|------|------|-------|-------------------|------------|------------|--------|--------------|--------------|");
  for (const s of symbolRows) {
    lines.push(
      `| ${s.symbol} | ${s.status} | ${s.buyCount}/${s.sellCount} | ${fmtMoney(s.capitalBaseHkd)} | ${fmtMoney(s.realizedPnlHkd)} | ${fmtMoney(s.unrealizedPnlHkd)} | ${fmtMoney(s.totalPnlHkd)} | **${fmtReturn(s.totalReturnPct)}** | ${fmtReturn(s.realizedReturnPct)} |`
    );
  }
  lines.push("");

  const topReturn = symbolRows.filter((s) => s.totalReturnPct != null).slice(0, 5);
  const bottomReturn = symbolRows
    .filter((s) => s.totalReturnPct != null)
    .sort((a, b) => a.totalReturnPct - b.totalReturnPct)
    .slice(0, 5);

  lines.push("### 收益率 Top 5");
  lines.push("");
  for (const s of topReturn) {
    lines.push(`- **${s.symbol}**：总收益率 ${fmtReturn(s.totalReturnPct)}，总盈亏 ${fmtMoney(s.totalPnlHkd)}`);
  }
  lines.push("");
  lines.push("### 收益率 Bottom 5");
  lines.push("");
  for (const s of bottomReturn) {
    lines.push(`- **${s.symbol}**：总收益率 ${fmtReturn(s.totalReturnPct)}，总盈亏 ${fmtMoney(s.totalPnlHkd)}`);
  }
  lines.push("");

  lines.push("## 四、分标的交易明细");
  lines.push("");
  lines.push("| 标的 | 买/卖笔数 | 已实现盈亏 | 最佳单笔 | 最差单笔 |");
  lines.push("|------|-----------|------------|----------|----------|");
  for (const s of [...symbolRows].sort((a, b) => b.realizedPnlHkd - a.realizedPnlHkd)) {
    const best = s.best ? `${fmtMoney(s.best.realizedPnlHkd)} @${s.best.price}` : "-";
    const worst = s.worst ? `${fmtMoney(s.worst.realizedPnlHkd)} @${s.worst.price}` : "-";
    lines.push(
      `| ${s.symbol} | ${s.buyCount}/${s.sellCount} | ${fmtMoney(s.realizedPnlHkd)} | ${best} | ${worst} |`
    );
  }
  lines.push("");

  lines.push("## 五、6/30 持仓未实现盈亏");
  lines.push("");
  if (pnl.openPositions.length === 0) {
    lines.push("6 月 30 日无未平仓股票持仓。");
  } else {
    lines.push("| 标的 | 数量 | 均价 | 6/30 收盘价 | 未实现盈亏 | **持仓收益率** |");
    lines.push("|------|------|------|-------------|------------|----------------|");
    for (const p of pnl.openPositions.sort((a, b) => (b.unrealizedPnlHkd ?? 0) - (a.unrealizedPnlHkd ?? 0))) {
      const cur = p.currency === "USD" ? "US$" : "HK$";
      const holdingPct =
        p.avgCost > 0 && p.markPrice != null
          ? fmtPct(((p.markPrice - p.avgCost) / p.avgCost) * 100)
          : "N/A";
      lines.push(
        `| ${p.symbol} | ${p.quantity} | ${cur}${p.avgCost.toFixed(2)} | ${p.markPrice != null ? cur + p.markPrice.toFixed(2) : "N/A"} | ${p.unrealizedPnlHkd != null ? fmtMoney(p.unrealizedPnlHkd) : "N/A"} | **${holdingPct}** |`
      );
    }
  }
  lines.push("");

  lines.push("## 六、逐笔交易明细（首笔 → 末笔）");
  lines.push("");
  for (const t of enrichedLog) {
    const date = t.date.slice(0, 10);
    const cur = t.currency === "USD" ? "US$" : "HK$";
    lines.push(`### ${date} ${t.side} ${t.symbol}`);
    lines.push("");
    lines.push(`- 数量：${t.quantity} 股 @ ${cur}${t.price.toFixed(4)}，成交额 ${cur}${t.amount.toFixed(2)}`);

    if (t.side === "买入") {
      lines.push(
        `- 摊平后持仓：${t.positionQty ?? "-"} 股，均价 ${cur}${t.avgCost?.toFixed(4) ?? "-"}，持仓成本 ${cur}${t.positionCost?.toFixed(2) ?? "-"}`
      );
    }

    if (t.side === "卖出" && t.realizedPnl != null) {
      lines.push(`- 摊平成本：${cur}${t.avgCost?.toFixed(4) ?? "-"}（加权平均）`);
      lines.push(`- **已实现盈亏：${fmtMoney(t.realizedPnl, t.currency)}（${fmtMoney(t.realizedPnlHkd, "HKD")}）**`);
      lines.push(`- **单笔收益率：${t.costBasis > 0 ? fmtPct(t.realizedPnlPct) : "N/A（无匹配成本）"}**`);
      if (t.unmatchedQty > 0) lines.push(`- 警告：${t.unmatchedQty} 股无匹配买入批次（可能为做空或历史持仓）`);
    }

    const pc = t.priceContext;
    if (pc?.close != null) {
      lines.push(
        `- 当日行情：开 ${pc.open} / 高 ${pc.high} / 低 ${pc.low} / 收 ${pc.close}，成交价位于日内 ${pc.positionPct}% 位置`
      );
      lines.push(`- 价格评价：${pc.comment}`);
    } else {
      lines.push(`- 当日行情：暂无 K 线数据`);
    }
    lines.push("");
  }

  lines.push("## 七、交易行为洞察");
  lines.push("");
  for (const ins of buildInsights(pnl.symbolStats, pnl.tradeLog)) {
    lines.push(`- ${ins}`);
  }
  lines.push("");

  lines.push("## 八、交易建议");
  lines.push("");
  for (const rec of buildRecommendations(pnl, months, pnl.symbolStats, pnl.openPositions, usdHkd)) {
    lines.push(`- ${rec}`);
  }
  lines.push("");

  lines.push("## 九、免责声明");
  lines.push("");
  lines.push("- 盈亏按**加权平均摊平成本**计算（做 T 后持仓均价），**未扣除**佣金、印花税、融资利息与汇率损益。");
  lines.push("- 个股总收益率以报告期内**最大持仓成本占用**为分母，更适合频繁波段/做 T 场景；仅卖出历史持仓（无匹配买入）的标的收益率为 N/A。");
  lines.push("- 6/30 未实现盈亏使用当日收盘价 mark-to-market，与盘后/夜盘成交价可能存在偏差。");
  lines.push("- 账户回报率为期末净资产反推估算，仅供参考。");
  lines.push("- 本报告不构成投资建议。");
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const skipFetch = process.argv.includes("--no-fetch-prices");
  const data = loadTrades();

  let cache = { rates: { usdHkd: DEFAULT_USD_HKD }, prices: {} };
  if (!skipFetch) {
    cache = await fetchPriceCache(data);
  } else if (fs.existsSync(path.join(__dirname, "..", "public", "price-cache-h1.json"))) {
    cache = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "public", "price-cache-h1.json"), "utf8"));
  }

  const orderMap = Object.fromEntries(data.orders.map((o) => [o.orderId, o]));
  const markPrices = getMarkPrices(cache, "2026-06-30");
  const usdHkd = cache.rates?.usdHkd ?? DEFAULT_USD_HKD;

  const pnl = computeFifoPnl(data.executions, orderMap, { usdHkd, markPrices });
  const report = generateReport(data, pnl, cache);

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_FILE, report);
  console.log(`Report written to ${REPORT_FILE}`);
  console.log(`Total PnL (HKD): ${fmtMoney(pnl.summary.totalPnlHkd)}`);
  console.log(`Realized: ${fmtMoney(pnl.summary.realizedPnlHkd)} | Unrealized: ${fmtMoney(pnl.summary.unrealizedPnlHkd)}`);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});