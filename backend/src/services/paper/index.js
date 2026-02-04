const { createStore, DEFAULT_SLIPPAGE, buildState } = require("./store");

const store = createStore();

const assertNumber = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    const error = new Error(`${fieldName} must be a number.`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

const initPortfolio = async ({ startingCash }) => {
  const cash = assertNumber(startingCash, "startingCash");
  if (cash <= 0) {
    const error = new Error("startingCash must be greater than zero.");
    error.statusCode = 400;
    throw error;
  }

  return store.reset(cash);
};

const getState = async () => {
  const state = await store.getState();
  if (!state) {
    const error = new Error("Paper portfolio is not initialized.");
    error.statusCode = 404;
    throw error;
  }

  return buildState(state);
};

const placeOrder = async ({ symbol, side, qty, type }) => {
  if (typeof symbol !== "string" || !symbol.trim()) {
    const error = new Error("symbol is required.");
    error.statusCode = 400;
    throw error;
  }
  const normalizedSide = typeof side === "string" ? side.toLowerCase() : "";
  if (!{"buy": true, "sell": true}[normalizedSide]) {
    const error = new Error('side must be either "buy" or "sell".');
    error.statusCode = 400;
    throw error;
  }
  if (type !== "market") {
    const error = new Error('Only type "market" is supported.');
    error.statusCode = 400;
    throw error;
  }

  const quantity = assertNumber(qty, "qty");
  if (quantity <= 0) {
    const error = new Error("qty must be greater than zero.");
    error.statusCode = 400;
    throw error;
  }

  return store.placeOrder({
    symbol,
    side: normalizedSide,
    qty: quantity,
    type,
    slippage: DEFAULT_SLIPPAGE,
  });
};

const markToMarket = async ({ prices }) => {
  if (!prices || typeof prices !== "object") {
    const error = new Error("prices object is required.");
    error.statusCode = 400;
    throw error;
  }

  const normalized = {};
  for (const [symbol, price] of Object.entries(prices)) {
    if (typeof symbol !== "string" || !symbol.trim()) {
      const error = new Error("prices must use non-empty symbols.");
      error.statusCode = 400;
      throw error;
    }
    const numeric = assertNumber(price, `price for ${symbol}`);
    normalized[symbol.trim().toUpperCase()] = numeric;
  }

  return store.markToMarket(normalized);
};

module.exports = {
  initPortfolio,
  getState,
  placeOrder,
  markToMarket,
};
