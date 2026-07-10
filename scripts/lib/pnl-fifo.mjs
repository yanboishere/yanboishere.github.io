export const DEFAULT_USD_HKD = 7.84;

export function isOption(symbol) {
  return /\d{6}[CP]\d+\.US$/i.test(symbol);
}

export function isStockOrEtf(symbol) {
  return (symbol.endsWith(".US") || symbol.endsWith(".HK")) && !isOption(symbol);
}

export function isBuy(side) {
  return String(side) === "1" || String(side).toLowerCase().includes("buy");
}

export function isSell(side) {
  return String(side) === "2" || String(side).toLowerCase().includes("sell");
}

export function getCurrency(symbol) {
  return symbol.endsWith(".HK") ? "HKD" : "USD";
}

export function toHkd(amount, currency, usdHkd = DEFAULT_USD_HKD) {
  return currency === "USD" ? amount * usdHkd : amount;
}

export function fmtMoney(amount, currency = "HKD") {
  const prefix = currency === "USD" ? "US$" : "HK$";
  const sign = amount < 0 ? "-" : amount > 0 ? "+" : "";
  return `${sign}${prefix}${Math.abs(amount).toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
}

export function fmtPct(v) {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

/**
 * Process stock executions with weighted-average cost (做 T 摊平成本).
 * Tracks max position cost as the capital-at-risk denominator for return %.
 */
export function computeFifoPnl(executions, orderMap, options = {}) {
  const { usdHkd = DEFAULT_USD_HKD, markPrices = {} } = options;
  const positions = {};
  const tradeLog = [];
  const symbolStats = {};

  const stockExecs = executions
    .filter((e) => isStockOrEtf(e.symbol))
    .sort((a, b) => a.tradeDoneAt.localeCompare(b.tradeDoneAt));

  for (const e of stockExecs) {
    const side = orderMap[e.orderId]?.side;
    const currency = getCurrency(e.symbol);
    if (!positions[e.symbol]) positions[e.symbol] = { qty: 0, avgCost: 0 };
    if (!symbolStats[e.symbol]) {
      symbolStats[e.symbol] = {
        symbol: e.symbol,
        currency,
        buyCount: 0,
        sellCount: 0,
        buyAmount: 0,
        sellAmount: 0,
        realizedPnl: 0,
        realizedPnlHkd: 0,
        maxPositionCost: 0,
        trades: [],
      };
    }
    const stat = symbolStats[e.symbol];
    const pos = positions[e.symbol];

    if (isBuy(side)) {
      const prevCost = pos.qty * pos.avgCost;
      pos.qty += e.quantity;
      pos.avgCost = pos.qty > 0 ? (prevCost + e.amount) / pos.qty : 0;

      const positionCost = pos.qty * pos.avgCost;
      if (positionCost > stat.maxPositionCost) stat.maxPositionCost = positionCost;

      stat.buyCount++;
      stat.buyAmount += e.amount;
      tradeLog.push({
        date: e.tradeDoneAt,
        symbol: e.symbol,
        side: "买入",
        quantity: e.quantity,
        price: e.price,
        amount: e.amount,
        currency,
        positionQty: pos.qty,
        avgCost: pos.avgCost,
        positionCost,
        realizedPnl: null,
        realizedPnlHkd: null,
        realizedPnlPct: null,
      });
    } else if (isSell(side)) {
      const matchedQty = Math.min(e.quantity, pos.qty);
      const unmatchedQty = e.quantity - matchedQty;
      const avgCostAtSell = pos.avgCost;
      const costBasis = matchedQty * avgCostAtSell;
      const proceeds = matchedQty * e.price;
      const realizedPnl = proceeds - costBasis;
      const realizedPnlHkd = toHkd(realizedPnl, currency, usdHkd);
      const realizedPnlPct = costBasis > 0 ? (realizedPnl / costBasis) * 100 : 0;

      pos.qty -= matchedQty;

      stat.sellCount++;
      stat.sellAmount += e.amount;
      stat.realizedPnl += realizedPnl;
      stat.realizedPnlHkd += realizedPnlHkd;

      const entry = {
        date: e.tradeDoneAt,
        symbol: e.symbol,
        side: "卖出",
        quantity: e.quantity,
        price: e.price,
        amount: e.amount,
        currency,
        matchedQty,
        costBasis,
        avgCost: avgCostAtSell,
        positionQty: pos.qty,
        realizedPnl,
        realizedPnlHkd,
        realizedPnlPct,
        unmatchedQty,
      };
      stat.trades.push(entry);
      tradeLog.push(entry);
    }
  }

  const openPositions = [];
  let unrealizedPnlHkd = 0;

  for (const [symbol, pos] of Object.entries(positions)) {
    if (pos.qty <= 0) continue;

    const currency = getCurrency(symbol);
    const cost = pos.qty * pos.avgCost;
    const mark = markPrices[symbol];
    const markPrice = mark?.close ?? null;
    const unrealized = markPrice != null ? (markPrice - pos.avgCost) * pos.qty : null;
    const unrealizedHkd = unrealized != null ? toHkd(unrealized, currency, usdHkd) : null;

    if (unrealizedHkd != null) unrealizedPnlHkd += unrealizedHkd;

    openPositions.push({
      symbol,
      currency,
      quantity: pos.qty,
      avgCost: pos.avgCost,
      costBasis: cost,
      markPrice,
      markDate: mark?.date ?? null,
      unrealizedPnl: unrealized,
      unrealizedPnlHkd: unrealizedHkd,
    });
  }

  const realizedPnlHkd = tradeLog
    .filter((t) => t.side === "卖出" && t.realizedPnlHkd != null)
    .reduce((s, t) => s + t.realizedPnlHkd, 0);

  const sellWins = tradeLog.filter((t) => t.side === "卖出" && t.realizedPnl > 0).length;
  const sellTotal = tradeLog.filter((t) => t.side === "卖出").length;

  return {
    tradeLog,
    symbolStats,
    openPositions,
    summary: {
      totalTrades: stockExecs.length,
      buyTrades: tradeLog.filter((t) => t.side === "买入").length,
      sellTrades: sellTotal,
      buyAmountHkd: Object.values(symbolStats).reduce(
        (s, st) => s + toHkd(st.buyAmount, st.currency, usdHkd),
        0
      ),
      sellAmountHkd: Object.values(symbolStats).reduce(
        (s, st) => s + toHkd(st.sellAmount, st.currency, usdHkd),
        0
      ),
      realizedPnlHkd,
      unrealizedPnlHkd,
      totalPnlHkd: realizedPnlHkd + unrealizedPnlHkd,
      sellWinRate: sellTotal > 0 ? (sellWins / sellTotal) * 100 : 0,
      sellWins,
      sellTotal,
    },
  };
}

/**
 * Attach per-symbol return metrics using max position cost as denominator.
 */
export function enrichSymbolReturns(symbolStats, openPositions, usdHkd = DEFAULT_USD_HKD) {
  const openMap = Object.fromEntries(openPositions.map((p) => [p.symbol, p]));

  return Object.values(symbolStats).map((s) => {
    const buyAmountHkd = toHkd(s.buyAmount, s.currency, usdHkd);
    const sellAmountHkd = toHkd(s.sellAmount, s.currency, usdHkd);
    const realizedPnlHkd = s.realizedPnlHkd;
    const maxPositionCostHkd = toHkd(s.maxPositionCost ?? 0, s.currency, usdHkd);

    const open = openMap[s.symbol];
    const openCostHkd = open ? toHkd(open.costBasis, s.currency, usdHkd) : 0;
    const capitalBaseHkd = Math.max(maxPositionCostHkd, openCostHkd);

    const unrealizedPnlHkd = open?.unrealizedPnlHkd ?? 0;
    const totalPnlHkd = realizedPnlHkd + (unrealizedPnlHkd || 0);

    const totalReturnPct =
      capitalBaseHkd > 0 ? (totalPnlHkd / capitalBaseHkd) * 100 : null;
    const realizedReturnPct =
      capitalBaseHkd > 0 ? (realizedPnlHkd / capitalBaseHkd) * 100 : null;
    const holdingReturnPct =
      open?.avgCost > 0 && open?.markPrice != null
        ? ((open.markPrice - open.avgCost) / open.avgCost) * 100
        : null;

    const status =
      open && open.quantity > 0
        ? s.sellCount > 0
          ? "持仓中（部分清仓）"
          : "持仓中"
        : s.sellCount > 0
          ? "已清仓"
          : "仅买入";

    return {
      ...s,
      buyAmountHkd,
      sellAmountHkd,
      maxPositionCostHkd,
      capitalBaseHkd,
      unrealizedPnlHkd: unrealizedPnlHkd || 0,
      totalPnlHkd,
      totalReturnPct,
      realizedReturnPct,
      holdingReturnPct,
      status,
      openQty: open?.quantity ?? 0,
      openAvgCost: open?.avgCost ?? null,
      openMarkPrice: open?.markPrice ?? null,
    };
  });
}

export function monthlyBreakdown(tradeLog, usdHkd = DEFAULT_USD_HKD) {
  const months = {};
  for (const t of tradeLog) {
    const m = t.date.slice(0, 7);
    if (!months[m]) months[m] = { trades: 0, buys: 0, sells: 0, buyHkd: 0, sellHkd: 0, realizedHkd: 0 };
    months[m].trades++;
    if (t.side === "买入") {
      months[m].buys++;
      months[m].buyHkd += toHkd(t.amount, t.currency, usdHkd);
    } else {
      months[m].sells++;
      months[m].sellHkd += toHkd(t.amount, t.currency, usdHkd);
      months[m].realizedHkd += t.realizedPnlHkd ?? 0;
    }
  }
  return months;
}