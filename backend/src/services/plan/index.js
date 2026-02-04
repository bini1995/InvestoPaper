const { getCandles } = require("../marketData");
const { generateStrategyV1Signal } = require("../strategy/strategyV1");
const { getLatestByType } = require("../journal");

const assertSymbol = (symbol) => {
  if (typeof symbol !== "string" || !symbol.trim()) {
    const error = new Error("symbol is required.");
    error.statusCode = 400;
    throw error;
  }
  return symbol.trim().toUpperCase();
};

const buildKeyLevels = (candles) => {
  if (!Array.isArray(candles) || candles.length === 0) {
    return { support: null, resistance: null };
  }

  const window = candles.slice(-20);
  let support = null;
  let resistance = null;

  for (const candle of window) {
    if (typeof candle?.low === "number") {
      support = support === null ? candle.low : Math.min(support, candle.low);
    }
    if (typeof candle?.high === "number") {
      resistance =
        resistance === null ? candle.high : Math.max(resistance, candle.high);
    }
  }

  return { support, resistance };
};

const buildChecklist = (signal) => {
  const checklist = [
    "Confirm liquidity and spread are acceptable.",
    "Validate key support/resistance levels.",
    "Check upcoming economic events and earnings.",
    "Confirm risk fits within position sizing rules.",
  ];

  if (signal === "buy") {
    checklist.unshift("Confirm trend remains in uptrend on higher timeframes.");
  }

  if (signal === "sell") {
    checklist.unshift(
      "Confirm trend remains in downtrend on higher timeframes."
    );
  }

  return checklist;
};

const buildNewsBullets = (newsEntry) => {
  if (!newsEntry) {
    return [];
  }

  const payload = newsEntry.payload || {};
  if (Array.isArray(payload.bullets)) {
    return payload.bullets;
  }
  if (typeof payload.summary === "string") {
    return [payload.summary];
  }
  return [];
};

const getDailyPlan = async ({ symbol }) => {
  const normalizedSymbol = assertSymbol(symbol);
  const candlesPayload = await getCandles({
    symbol: normalizedSymbol,
    interval: "1d",
    limit: 200,
  });

  const candles = candlesPayload?.candles || [];
  const signal = generateStrategyV1Signal({ symbol: normalizedSymbol, candles });
  const keyLevels = buildKeyLevels(candles);
  const newsEntry = await getLatestByType("news");

  return {
    date: new Date().toISOString().split("T")[0],
    symbol: normalizedSymbol,
    plan: {
      signal: signal.signal,
      risk: signal.risk,
      checklist: buildChecklist(signal.signal),
      keyLevels,
    },
    news: {
      bullets: buildNewsBullets(newsEntry),
    },
  };
};

module.exports = {
  getDailyPlan,
};
