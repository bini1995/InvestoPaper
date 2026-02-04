const config = require("../config");
const { ingestNewsFromRss } = require("../services/news");

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const runNewsIngestion = async () => {
  if (!Array.isArray(config.newsRssUrls) || config.newsRssUrls.length === 0) {
    return;
  }

  try {
    const result = await ingestNewsFromRss(config.newsRssUrls);
    if (result.inserted.length > 0) {
      console.log(`News ingestion added ${result.inserted.length} items.`);
    }
  } catch (error) {
    console.error("News ingestion failed:", error);
  }
};

const startNewsJob = () => {
  runNewsIngestion();
  return setInterval(runNewsIngestion, FIFTEEN_MINUTES_MS);
};

module.exports = {
  startNewsJob,
};
