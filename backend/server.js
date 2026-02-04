const config = require("./src/config");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

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

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});
