const config = require("../../config");
const { getCached, setCached } = require("./cache");
const { getProvider } = require("./providers");

const SUPPORTED_INTERVALS = new Set(["1d", "1h"]);

const getCandles = async ({ symbol, interval, limit }) => {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const normalizedInterval = interval.trim();

  if (!SUPPORTED_INTERVALS.has(normalizedInterval)) {
    const error = new Error(
      'Only "1d" and "1h" intervals are supported at this time.'
    );
    error.statusCode = 400;
    throw error;
  }

  const cached = getCached(normalizedSymbol, normalizedInterval, limit);
  if (cached) {
    return cached;
  }

  const provider = getProvider(config.marketDataProvider);
  const result = await provider.getCandles({
    symbol: normalizedSymbol,
    interval: normalizedInterval,
    limit,
    providerName: config.marketDataProvider,
  });

  setCached(normalizedSymbol, normalizedInterval, limit, result);
  return result;
};

module.exports = {
  getCandles,
};
