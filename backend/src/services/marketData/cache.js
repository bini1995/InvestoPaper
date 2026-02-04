const CACHE_TTL_MS = 60 * 1000;

const cache = new Map();

const getCacheKey = (symbol, interval, limit) =>
  `${symbol}|${interval}|${limit}`;

const getCached = (symbol, interval, limit) => {
  const key = getCacheKey(symbol, interval, limit);
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
};

const setCached = (symbol, interval, limit, value) => {
  const key = getCacheKey(symbol, interval, limit);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

module.exports = {
  getCached,
  setCached,
};
