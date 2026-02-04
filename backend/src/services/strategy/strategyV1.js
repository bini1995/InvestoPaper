const { atr, clamp, rsi, simpleMovingAverage } = require("./indicators");

const OVERSOLD = 30;
const OVERBOUGHT = 70;
const STOP_LOSS_MULTIPLIER = 1.5;
const TAKE_PROFIT_MULTIPLIER = 2;
const POSITION_SIZE_PCT = 0.02;

const buildHoldResponse = ({ symbol, entry, reasoning }) => ({
  symbol,
  signal: "hold",
  confidence: 0,
  reasoning,
  risk: {
    entry,
    stopLoss: null,
    takeProfit: null,
    positionSizePct: POSITION_SIZE_PCT,
  },
});

const generateStrategyV1Signal = ({ symbol, candles }) => {
  const latest = candles[candles.length - 1];
  const entry = latest?.close ?? null;

  const sma20 = simpleMovingAverage(candles, 20);
  const sma50 = simpleMovingAverage(candles, 50);
  const latestRsi = rsi(candles, 14);
  const latestAtr = atr(candles, 14);

  const reasoning = [];

  if (sma20 === null || sma50 === null || latestRsi === null || latestAtr === null) {
    reasoning.push("Not enough candle data to compute indicators.");
    return buildHoldResponse({ symbol, entry, reasoning });
  }

  const trendDirection = sma20 > sma50 ? "uptrend" : sma20 < sma50 ? "downtrend" : "flat";
  reasoning.push(
    `Trend filter: SMA20 ${sma20.toFixed(2)} vs SMA50 ${sma50.toFixed(2)} (${trendDirection}).`
  );
  reasoning.push(`RSI(14) is ${latestRsi.toFixed(2)}.`);
  reasoning.push(`ATR(14) is ${latestAtr.toFixed(2)}.`);

  let signal = "hold";
  if (trendDirection === "uptrend" && latestRsi <= OVERSOLD) {
    signal = "buy";
  } else if (trendDirection === "downtrend" && latestRsi >= OVERBOUGHT) {
    signal = "sell";
  }

  if (signal === "hold") {
    reasoning.push("Entry conditions not met; holding position.");
    return buildHoldResponse({ symbol, entry, reasoning });
  }

  const riskDistance = latestAtr * STOP_LOSS_MULTIPLIER;
  const stopLoss =
    signal === "buy" ? entry - riskDistance : entry + riskDistance;
  const takeProfit =
    signal === "buy"
      ? entry + riskDistance * TAKE_PROFIT_MULTIPLIER
      : entry - riskDistance * TAKE_PROFIT_MULTIPLIER;

  const rsiStrength =
    signal === "buy"
      ? clamp((OVERSOLD - latestRsi) / OVERSOLD, 0, 1)
      : clamp((latestRsi - OVERBOUGHT) / (100 - OVERBOUGHT), 0, 1);
  const trendStrength = clamp(Math.abs((sma20 - sma50) / sma50), 0, 1);
  const confidence = clamp((rsiStrength + trendStrength) / 2, 0, 1);

  reasoning.push(
    `Signal generated: ${signal} with stop loss ${STOP_LOSS_MULTIPLIER}x ATR and take profit ${TAKE_PROFIT_MULTIPLIER}x risk.`
  );

  return {
    symbol,
    signal,
    confidence,
    reasoning,
    risk: {
      entry,
      stopLoss,
      takeProfit,
      positionSizePct: POSITION_SIZE_PCT,
    },
  };
};

module.exports = {
  generateStrategyV1Signal,
};
