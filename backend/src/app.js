const config = require("./config");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { getCandles } = require("./services/marketData");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get("/api/config/public", (_req, res) => {
  res.json(config.public);
});

app.get("/api/market/candles", async (req, res) => {
  const symbol = typeof req.query.symbol === "string" ? req.query.symbol : "";
  const interval =
    typeof req.query.interval === "string" ? req.query.interval : "";
  const limitValue = Number(req.query.limit ?? 200);
  const limit = Number.isFinite(limitValue) ? Math.max(1, limitValue) : 200;

  if (!symbol || !interval) {
    return res
      .status(400)
      .json({ error: "symbol and interval are required query parameters." });
  }

  try {
    const payload = await getCandles({ symbol, interval, limit });
    return res.json(payload);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
});

module.exports = app;
