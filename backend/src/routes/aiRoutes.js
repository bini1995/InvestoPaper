const express = require("express");

const { callOpenRouter } = require("../services/ai/openrouterClient");
const {
  buildNewsSummaryMessages,
  buildTradeBriefingMessages,
} = require("../services/ai/prompts");

const router = express.Router();

const isNonEmptyString = (value) => typeof value === "string" && value.trim();

router.post("/news-summary", async (req, res) => {
  const symbol = isNonEmptyString(req.body?.symbol) ? req.body.symbol.trim() : "";
  const items = Array.isArray(req.body?.items) ? req.body.items : [];

  const normalizedItems = items
    .filter((item) => item)
    .map((item) => ({
      title: isNonEmptyString(item.title) ? item.title.trim() : "",
      url: isNonEmptyString(item.url) ? item.url.trim() : "",
      published_at: isNonEmptyString(item.published_at)
        ? item.published_at.trim()
        : "",
    }))
    .filter((item) => item.title && item.url);

  if (!symbol || normalizedItems.length === 0) {
    return res.status(400).json({
      error: "symbol (string) and items (array with title and url) are required.",
    });
  }

  try {
    const messages = buildNewsSummaryMessages({
      symbol,
      items: normalizedItems,
    });
    const summary = await callOpenRouter({ messages });
    return res.json(summary);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
});

router.post("/trade-briefing", async (req, res) => {
  const symbol = isNonEmptyString(req.body?.symbol) ? req.body.symbol.trim() : "";
  const signalOutput = req.body?.signalOutput ?? null;
  const newsSummary = req.body?.newsSummary ?? null;
  const portfolioState = req.body?.portfolioState ?? null;

  if (!symbol || !signalOutput || !newsSummary || !portfolioState) {
    return res.status(400).json({
      error:
        "symbol, signalOutput, newsSummary, and portfolioState are required in the request body.",
    });
  }

  try {
    const messages = buildTradeBriefingMessages({
      symbol,
      signalOutput,
      newsSummary,
      portfolioState,
    });
    const briefing = await callOpenRouter({ messages });
    return res.json(briefing);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
});

module.exports = router;
