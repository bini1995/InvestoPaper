const { Pool } = require("pg");

const buildEntry = (row) => ({
  id: row.id,
  createdAt: row.created_at instanceof Date
    ? row.created_at.toISOString()
    : row.createdAt,
  type: row.type,
  payload: row.payload,
});

class MemoryStore {
  constructor() {
    this.entries = [];
    this.nextId = 1;
  }

  async init() {}

  async createEntry({ type, payload }) {
    const entry = {
      id: this.nextId++,
      createdAt: new Date().toISOString(),
      type,
      payload,
    };
    this.entries.unshift(entry);
    return entry;
  }

  async listEntries(limit) {
    return this.entries.slice(0, limit);
  }

  async getLatestByType(type) {
    return this.entries.find((entry) => entry.type === type) || null;
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
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb
      );
      CREATE INDEX IF NOT EXISTS journal_entries_type_idx
        ON journal_entries (type, created_at DESC);
    `);

    this.initialized = true;
  }

  async createEntry({ type, payload }) {
    await this.init();
    const result = await this.pool.query(
      "INSERT INTO journal_entries (type, payload) VALUES ($1, $2) RETURNING *",
      [type, payload]
    );
    return buildEntry(result.rows[0]);
  }

  async listEntries(limit) {
    await this.init();
    const result = await this.pool.query(
      "SELECT * FROM journal_entries ORDER BY created_at DESC, id DESC LIMIT $1",
      [limit]
    );
    return result.rows.map((row) => buildEntry(row));
  }

  async getLatestByType(type) {
    await this.init();
    const result = await this.pool.query(
      "SELECT * FROM journal_entries WHERE type = $1 ORDER BY created_at DESC, id DESC LIMIT 1",
      [type]
    );
    return result.rows[0] ? buildEntry(result.rows[0]) : null;
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
