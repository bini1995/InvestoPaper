const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getCloseSeries = (candles) => candles.map((candle) => candle.close);

const simpleMovingAverage = (candles, period) => {
  if (!Array.isArray(candles) || candles.length < period) {
    return null;
  }
  const closes = getCloseSeries(candles);
  const slice = closes.slice(closes.length - period);
  const sum = slice.reduce((total, value) => total + value, 0);
  return sum / period;
};

const rsi = (candles, period = 14) => {
  if (!Array.isArray(candles) || candles.length < period + 1) {
    return null;
  }
  const closes = getCloseSeries(candles);
  const startIndex = closes.length - period;
  let gains = 0;
  let losses = 0;

  for (let i = startIndex; i < closes.length; i += 1) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      gains += change;
    } else if (change < 0) {
      losses += Math.abs(change);
    }
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0 && averageGain === 0) {
    return 50;
  }
  if (averageLoss === 0) {
    return 100;
  }
  if (averageGain === 0) {
    return 0;
  }

  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
};

const atr = (candles, period = 14) => {
  if (!Array.isArray(candles) || candles.length < period + 1) {
    return null;
  }

  const startIndex = candles.length - period;
  const ranges = [];

  for (let i = startIndex; i < candles.length; i += 1) {
    const current = candles[i];
    const previous = candles[i - 1];
    const highLow = current.high - current.low;
    const highClose = Math.abs(current.high - previous.close);
    const lowClose = Math.abs(current.low - previous.close);
    const trueRange = Math.max(highLow, highClose, lowClose);
    ranges.push(trueRange);
  }

  const sum = ranges.reduce((total, value) => total + value, 0);
  return sum / period;
};

module.exports = {
  atr,
  clamp,
  rsi,
  simpleMovingAverage,
};
