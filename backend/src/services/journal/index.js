const { createStore } = require("./store");

const store = createStore();

const ALLOWED_TYPES = new Set(["signal", "news", "manual_trade", "note"]);

const assertType = (type) => {
  if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
    const error = new Error(
      'type must be one of "signal", "news", "manual_trade", or "note".'
    );
    error.statusCode = 400;
    throw error;
  }
};

const normalizePayload = (payload) => {
  if (payload === undefined) {
    return {};
  }
  if (payload === null || typeof payload !== "object") {
    const error = new Error("payload must be a JSON object.");
    error.statusCode = 400;
    throw error;
  }
  return payload;
};

const createEntry = async ({ type, payload }) => {
  assertType(type);
  const normalizedPayload = normalizePayload(payload);
  return store.createEntry({ type, payload: normalizedPayload });
};

const listEntries = async ({ limit }) => {
  const parsed = Number(limit ?? 100);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    const error = new Error("limit must be a positive number.");
    error.statusCode = 400;
    throw error;
  }
  const normalizedLimit = Math.min(parsed, 500);
  return store.listEntries(normalizedLimit);
};

const getLatestByType = async (type) => {
  assertType(type);
  return store.getLatestByType(type);
};

module.exports = {
  createEntry,
  listEntries,
  getLatestByType,
};
