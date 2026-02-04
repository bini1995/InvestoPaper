const express = require("express");

const { createEntry, listEntries } = require("../services/journal");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const entry = await createEntry({
      type: req.body?.type,
      payload: req.body?.payload,
    });
    return res.status(201).json(entry);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const entries = await listEntries({ limit: req.query?.limit });
    return res.json({ entries });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message });
  }
});

module.exports = router;
