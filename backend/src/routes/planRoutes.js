const express = require("express");

const { getDailyPlan } = require("../services/plan");

const router = express.Router();

router.get("/today", async (req, res) => {
  try {
    const symbol = typeof req.query.symbol === "string" ? req.query.symbol : "";
    if (!symbol.trim()) {
      return res
        .status(400)
        .json({ error: "symbol is required as a query parameter." });
    }

    const plan = await getDailyPlan({ symbol });
    return res.json(plan);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
});

module.exports = router;
