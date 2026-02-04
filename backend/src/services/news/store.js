const { Pool } = require("pg");

const buildItem = (row) => ({
  id: row.id,
  source: row.source,
  title: row.title,
  url: row.url,
  publishedAt:
    row.published_at instanceof Date
      ? row.published_at.toISOString()
      : row.publishedAt,
  summary: row.summary,
  rawJson: row.raw_json,
});

class MemoryStore {
  constructor() {
    this.items = [];
    this.nextId = 1;
  }

  async init() {}

  async insertItems(items) {
    const inserted = [];
    for (const item of items) {
      if (!item.url) {
        continue;
      }
      const exists = this.items.some((existing) => existing.url === item.url);
      if (exists) {
        continue;
      }
      const entry = {
        id: this.nextId++,
        source: item.source,
        title: item.title,
        url: item.url,
        publishedAt: item.publishedAt || new Date().toISOString(),
        summary: item.summary || null,
        rawJson: item.rawJson || null,
      };
      this.items.unshift(entry);
      inserted.push(entry);
    }
    return inserted;
  }

  async listItems(limit) {
    return this.items.slice(0, limit);
  }
}

class PostgresStore {
  constructor(databaseUrl) {
    this.pool = new Pool({ connectionString: databaseUrl });
    this.initialized = false;
  }

  async init() {
    if (this.initialized) {
      return;
    }

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS news_items (
        id SERIAL PRIMARY KEY,
        source TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        published_at TIMESTAMP,
        summary TEXT,
        raw_json JSONB
      );
      CREATE INDEX IF NOT EXISTS news_items_published_at_idx
        ON news_items (published_at DESC, id DESC);
    `);

    this.initialized = true;
  }

  async insertItems(items) {
    await this.init();
    const inserted = [];

    for (const item of items) {
      if (!item.url) {
        continue;
      }
      const publishedAt = item.publishedAt ? new Date(item.publishedAt) : null;
      const result = await this.pool.query(
        `
          INSERT INTO news_items (source, title, url, published_at, summary, raw_json)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (url) DO NOTHING
          RETURNING *
        `,
        [
          item.source,
          item.title,
          item.url,
          publishedAt,
          item.summary || null,
          item.rawJson || null,
        ]
      );
      if (result.rows[0]) {
        inserted.push(buildItem(result.rows[0]));
      }
    }

    return inserted;
  }

  async listItems(limit) {
    await this.init();
    const result = await this.pool.query(
      `
        SELECT *
        FROM news_items
        ORDER BY published_at DESC NULLS LAST, id DESC
        LIMIT $1
      `,
      [limit]
    );
    return result.rows.map((row) => buildItem(row));
  }
}

const createStore = () => {
  if (process.env.DATABASE_URL) {
    return new PostgresStore(process.env.DATABASE_URL);
  }
  return new MemoryStore();
};

module.exports = {
  createStore,
};
