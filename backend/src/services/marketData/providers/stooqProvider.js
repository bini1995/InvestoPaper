const buildStooqSymbol = (symbol) => {
  const normalized = symbol.trim().toLowerCase();
  if (!normalized) {
    return normalized;
  }
  if (normalized.includes(".")) {
    return normalized;
  }
  return `${normalized}.us`;
};

const buildIntervalParam = (interval) => {
  if (interval === "1d") {
    return "d";
  }
  if (interval === "1h") {
    return "60";
  }
  return null;
};

const parseDateTime = (value) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00Z`).toISOString();
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

const parseCsv = (csv) => {
  const lines = csv.split("\n").map((line) => line.trim());
  const dataLines = lines.slice(1).filter(Boolean);
  return dataLines
    .map((line) => line.split(","))
    .filter((parts) => parts.length >= 6)
    .map((parts) => {
      const time = parseDateTime(parts[0]);
      if (!time) {
        return null;
      }
      return {
        time,
        open: Number(parts[1]),
        high: Number(parts[2]),
        low: Number(parts[3]),
        close: Number(parts[4]),
        volume: Number(parts[5]),
      };
    })
    .filter(Boolean);
};

const getCandles = async ({ symbol, interval, limit }) => {
  const intervalParam = buildIntervalParam(interval);
  if (!intervalParam) {
    const error = new Error(
      'Stooq provider supports only "1d" and "1h" intervals.'
    );
    error.statusCode = 400;
    throw error;
  }

  const stooqSymbol = buildStooqSymbol(symbol);
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(
    stooqSymbol
  )}&i=${intervalParam}`;

  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error(
      `Failed to fetch data from Stooq (${response.status}).`
    );
    error.statusCode = 502;
    throw error;
  }

  const csv = await response.text();
  const candles = parseCsv(csv);
  const limited = Number.isFinite(limit)
    ? candles.slice(Math.max(candles.length - limit, 0))
    : candles;

  return {
    symbol,
    interval,
    candles: limited,
  };
};

module.exports = {
  getCandles,
};
