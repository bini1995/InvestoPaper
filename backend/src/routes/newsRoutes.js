const express = require("express");

const { listNewsItems } = require("../services/news");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const items = await listNewsItems({ limit: req.query?.limit });
    return res.json({ items });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
});

module.exports = router;
