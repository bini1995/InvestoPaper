const Parser = require("rss-parser");

const { createStore } = require("./store");

const parser = new Parser();
const store = createStore();

const parseLimit = (value, fallback = 30) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, 200);
};

const normalizePublishedAt = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const normalizeItem = (item, source) => {
  const url = item?.link || item?.guid || "";
  const title = item?.title || "";
  if (!url || !title) {
    return null;
  }
  return {
    source,
    title,
    url,
    publishedAt: normalizePublishedAt(item.isoDate || item.pubDate),
    summary: item.contentSnippet || item.summary || item.content || null,
    rawJson: item,
  };
};

const ingestNewsFromRss = async (urls) => {
  if (!Array.isArray(urls) || urls.length === 0) {
    return { inserted: [] };
  }

  const items = [];

  for (const url of urls) {
    try {
      const feed = await parser.parseURL(url);
      const source = feed?.title || url;
      const feedItems = Array.isArray(feed?.items) ? feed.items : [];
      for (const item of feedItems) {
        const normalized = normalizeItem(item, source);
        if (normalized) {
          items.push(normalized);
        }
      }
    } catch (error) {
      console.error(`Failed to parse RSS feed ${url}:`, error.message);
    }
  }

  const inserted = await store.insertItems(items);
  return { inserted };
};

const listNewsItems = async ({ limit } = {}) => {
  const parsedLimit = parseLimit(limit, 30);
  return store.listItems(parsedLimit);
};

module.exports = {
  ingestNewsFromRss,
  listNewsItems,
};
