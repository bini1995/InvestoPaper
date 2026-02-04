const express = require("express");

const {
  initPortfolio,
  getState,
  placeOrder,
  markToMarket,
} = require("../services/paper");

const router = express.Router();

router.post("/init", async (req, res) => {
  try {
    const state = await initPortfolio({ startingCash: req.body?.startingCash });
    return res.json(state);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
});

router.get("/state", async (_req, res) => {
  try {
    const state = await getState();
    return res.json(state);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
});

router.post("/order", async (req, res) => {
  try {
    const state = await placeOrder({
      symbol: req.body?.symbol,
      side: req.body?.side,
      qty: req.body?.qty,
      type: req.body?.type,
    });
    return res.json(state);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
});

router.post("/mark-to-market", async (req, res) => {
  try {
    const state = await markToMarket({ prices: req.body?.prices });
    return res.json(state);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
});

module.exports = router;
