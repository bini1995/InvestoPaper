const { Pool } = require("pg");

const DEFAULT_SLIPPAGE = 0.0002;

const normalizeSymbol = (symbol) => symbol.trim().toUpperCase();

const toNumber = (value) => (value === null ? null : Number(value));

const buildState = ({ portfolio, positions, orders, trades }) => {
  if (!portfolio) {
    return null;
  }

  const prices = portfolio.lastPrices || {};
  const equity =
    portfolio.cash +
    positions.reduce((sum, position) => {
      const price = prices[position.symbol] ?? 0;
      return sum + position.qty * price;
    }, 0);

  return {
    portfolio: {
      id: portfolio.id,
      cash: portfolio.cash,
      equity,
      lastPrices: prices,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    },
    positions,
    orders,
    trades,
  };
};

class MemoryStore {
  constructor() {
    this.portfolio = null;
    this.positions = new Map();
    this.orders = [];
    this.trades = [];
    this.nextOrderId = 1;
    this.nextTradeId = 1;
  }

  async reset(startingCash) {
    const now = new Date().toISOString();
    this.portfolio = {
      id: 1,
      cash: startingCash,
      lastPrices: {},
      createdAt: now,
      updatedAt: now,
    };
    this.positions.clear();
    this.orders = [];
    this.trades = [];
    this.nextOrderId = 1;
    this.nextTradeId = 1;
    return buildState(await this.getState());
  }

  async getState() {
    if (!this.portfolio) {
      return null;
    }

    return {
      portfolio: this.portfolio,
      positions: Array.from(this.positions.values()),
      orders: [...this.orders],
      trades: [...this.trades],
    };
  }

  async markToMarket(prices) {
    if (!this.portfolio) {
      const error = new Error("Paper portfolio is not initialized.");
      error.statusCode = 404;
      throw error;
    }

    this.portfolio.lastPrices = {
      ...this.portfolio.lastPrices,
      ...prices,
    };
    this.portfolio.updatedAt = new Date().toISOString();
    return buildState(await this.getState());
  }

  async placeOrder({ symbol, side, qty, type, slippage }) {
    if (!this.portfolio) {
      const error = new Error("Paper portfolio is not initialized.");
      error.statusCode = 404;
      throw error;
    }

    const normalizedSymbol = normalizeSymbol(symbol);
    const lastPrice = this.portfolio.lastPrices[normalizedSymbol];

    if (!lastPrice) {
      const error = new Error(`Missing last price for ${normalizedSymbol}.`);
      error.statusCode = 400;
      throw error;
    }

    const slip = slippage ?? DEFAULT_SLIPPAGE;
    const fillPrice =
      side === "buy" ? lastPrice * (1 + slip) : lastPrice * (1 - slip);
    const fillCost = qty * fillPrice;

    const existingPosition = this.positions.get(normalizedSymbol);

    if (side === "buy" && this.portfolio.cash < fillCost) {
      const error = new Error("Insufficient cash for this order.");
      error.statusCode = 400;
      throw error;
    }

    if (side === "sell") {
      const existingQty = existingPosition?.qty ?? 0;
      if (existingQty < qty) {
        const error = new Error("Insufficient position quantity to sell.");
        error.statusCode = 400;
        throw error;
      }
    }

    if (side === "buy") {
      const prevQty = existingPosition?.qty ?? 0;
      const prevAvg = existingPosition?.avgPrice ?? 0;
      const newQty = prevQty + qty;
      const newAvg =
        newQty === 0 ? 0 : (prevQty * prevAvg + qty * fillPrice) / newQty;
      this.positions.set(normalizedSymbol, {
        symbol: normalizedSymbol,
        qty: newQty,
        avgPrice: newAvg,
        updatedAt: new Date().toISOString(),
      });
      this.portfolio.cash -= fillCost;
    } else {
      const prevQty = existingPosition?.qty ?? 0;
      const newQty = prevQty - qty;
      if (newQty === 0) {
        this.positions.delete(normalizedSymbol);
      } else {
        this.positions.set(normalizedSymbol, {
          symbol: normalizedSymbol,
          qty: newQty,
          avgPrice: existingPosition.avgPrice,
          updatedAt: new Date().toISOString(),
        });
      }
      this.portfolio.cash += fillCost;
    }

    this.portfolio.updatedAt = new Date().toISOString();

    const order = {
      id: this.nextOrderId++,
      symbol: normalizedSymbol,
      side,
      qty,
      type,
      status: "filled",
      filledQty: qty,
      filledPrice: fillPrice,
      createdAt: new Date().toISOString(),
    };
    const trade = {
      id: this.nextTradeId++,
      orderId: order.id,
      symbol: normalizedSymbol,
      side,
      qty,
      price: fillPrice,
      createdAt: new Date().toISOString(),
    };

    this.orders.push(order);
    this.trades.push(trade);

    return buildState(await this.getState());
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
      CREATE TABLE IF NOT EXISTS paper_portfolios (
        id SERIAL PRIMARY KEY,
        cash NUMERIC NOT NULL,
        last_prices JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS paper_positions (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER REFERENCES paper_portfolios(id) ON DELETE CASCADE,
        symbol TEXT NOT NULL,
        qty NUMERIC NOT NULL,
        avg_price NUMERIC NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (portfolio_id, symbol)
      );
      CREATE TABLE IF NOT EXISTS paper_orders (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER REFERENCES paper_portfolios(id) ON DELETE CASCADE,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        qty NUMERIC NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        filled_qty NUMERIC NOT NULL,
        filled_price NUMERIC NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS paper_trades (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER REFERENCES paper_portfolios(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES paper_orders(id) ON DELETE CASCADE,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        qty NUMERIC NOT NULL,
        price NUMERIC NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    this.initialized = true;
  }

  formatPortfolio(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      cash: toNumber(row.cash),
      lastPrices: row.last_prices || {},
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  formatPosition(row) {
    return {
      symbol: row.symbol,
      qty: toNumber(row.qty),
      avgPrice: toNumber(row.avg_price),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  formatOrder(row) {
    return {
      id: row.id,
      symbol: row.symbol,
      side: row.side,
      qty: toNumber(row.qty),
      type: row.type,
      status: row.status,
      filledQty: toNumber(row.filled_qty),
      filledPrice: toNumber(row.filled_price),
      createdAt: row.created_at.toISOString(),
    };
  }

  formatTrade(row) {
    return {
      id: row.id,
      orderId: row.order_id,
      symbol: row.symbol,
      side: row.side,
      qty: toNumber(row.qty),
      price: toNumber(row.price),
      createdAt: row.created_at.toISOString(),
    };
  }

  async reset(startingCash) {
    await this.init();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM paper_trades");
      await client.query("DELETE FROM paper_orders");
      await client.query("DELETE FROM paper_positions");
      await client.query("DELETE FROM paper_portfolios");
      const result = await client.query(
        "INSERT INTO paper_portfolios (cash) VALUES ($1) RETURNING *",
        [startingCash]
      );
      await client.query("COMMIT");
      const portfolio = this.formatPortfolio(result.rows[0]);
      return buildState({
        portfolio,
        positions: [],
        orders: [],
        trades: [],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getState() {
    await this.init();
    const portfolioResult = await this.pool.query(
      "SELECT * FROM paper_portfolios ORDER BY id DESC LIMIT 1"
    );
    const portfolio = this.formatPortfolio(portfolioResult.rows[0]);
    if (!portfolio) {
      return null;
    }

    const [positionsResult, ordersResult, tradesResult] = await Promise.all([
      this.pool.query(
        "SELECT * FROM paper_positions WHERE portfolio_id = $1 ORDER BY symbol",
        [portfolio.id]
      ),
      this.pool.query(
        "SELECT * FROM paper_orders WHERE portfolio_id = $1 ORDER BY id",
        [portfolio.id]
      ),
      this.pool.query(
        "SELECT * FROM paper_trades WHERE portfolio_id = $1 ORDER BY id",
        [portfolio.id]
      ),
    ]);

    return {
      portfolio,
      positions: positionsResult.rows.map((row) => this.formatPosition(row)),
      orders: ordersResult.rows.map((row) => this.formatOrder(row)),
      trades: tradesResult.rows.map((row) => this.formatTrade(row)),
    };
  }

  async markToMarket(prices) {
    await this.init();
    const state = await this.getState();
    if (!state) {
      const error = new Error("Paper portfolio is not initialized.");
      error.statusCode = 404;
      throw error;
    }

    const result = await this.pool.query(
      "UPDATE paper_portfolios SET last_prices = last_prices || $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *",
      [prices, state.portfolio.id]
    );

    const portfolio = this.formatPortfolio(result.rows[0]);
    return buildState({
      portfolio,
      positions: state.positions,
      orders: state.orders,
      trades: state.trades,
    });
  }

  async placeOrder({ symbol, side, qty, type, slippage }) {
    await this.init();
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const portfolioResult = await client.query(
        "SELECT * FROM paper_portfolios ORDER BY id DESC LIMIT 1 FOR UPDATE"
      );
      const portfolio = this.formatPortfolio(portfolioResult.rows[0]);
      if (!portfolio) {
        const error = new Error("Paper portfolio is not initialized.");
        error.statusCode = 404;
        throw error;
      }

      const normalizedSymbol = normalizeSymbol(symbol);
      const lastPrice = portfolio.lastPrices?.[normalizedSymbol];
      if (!lastPrice) {
        const error = new Error(`Missing last price for ${normalizedSymbol}.`);
        error.statusCode = 400;
        throw error;
      }

      const slip = slippage ?? DEFAULT_SLIPPAGE;
      const fillPrice =
        side === "buy" ? lastPrice * (1 + slip) : lastPrice * (1 - slip);
      const fillCost = qty * fillPrice;

      const positionResult = await client.query(
        "SELECT * FROM paper_positions WHERE portfolio_id = $1 AND symbol = $2",
        [portfolio.id, normalizedSymbol]
      );
      const existing = positionResult.rows[0]
        ? this.formatPosition(positionResult.rows[0])
        : null;

      if (side === "buy" && portfolio.cash < fillCost) {
        const error = new Error("Insufficient cash for this order.");
        error.statusCode = 400;
        throw error;
      }

      if (side === "sell") {
        const existingQty = existing?.qty ?? 0;
        if (existingQty < qty) {
          const error = new Error("Insufficient position quantity to sell.");
          error.statusCode = 400;
          throw error;
        }
      }

      if (side === "buy") {
        const prevQty = existing?.qty ?? 0;
        const prevAvg = existing?.avgPrice ?? 0;
        const newQty = prevQty + qty;
        const newAvg =
          newQty === 0 ? 0 : (prevQty * prevAvg + qty * fillPrice) / newQty;

        await client.query(
          `INSERT INTO paper_positions (portfolio_id, symbol, qty, avg_price)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (portfolio_id, symbol)
           DO UPDATE SET qty = $3, avg_price = $4, updated_at = NOW()`
          ,
          [portfolio.id, normalizedSymbol, newQty, newAvg]
        );

        await client.query(
          "UPDATE paper_portfolios SET cash = $1, updated_at = NOW() WHERE id = $2",
          [portfolio.cash - fillCost, portfolio.id]
        );
      } else {
        const prevQty = existing?.qty ?? 0;
        const newQty = prevQty - qty;
        if (newQty === 0) {
          await client.query(
            "DELETE FROM paper_positions WHERE portfolio_id = $1 AND symbol = $2",
            [portfolio.id, normalizedSymbol]
          );
        } else {
          await client.query(
            "UPDATE paper_positions SET qty = $1, updated_at = NOW() WHERE portfolio_id = $2 AND symbol = $3",
            [newQty, portfolio.id, normalizedSymbol]
          );
        }

        await client.query(
          "UPDATE paper_portfolios SET cash = $1, updated_at = NOW() WHERE id = $2",
          [portfolio.cash + fillCost, portfolio.id]
        );
      }

      const orderResult = await client.query(
        `INSERT INTO paper_orders
          (portfolio_id, symbol, side, qty, type, status, filled_qty, filled_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          portfolio.id,
          normalizedSymbol,
          side,
          qty,
          type,
          "filled",
          qty,
          fillPrice,
        ]
      );

      const order = this.formatOrder(orderResult.rows[0]);

      const tradeResult = await client.query(
        `INSERT INTO paper_trades
          (portfolio_id, order_id, symbol, side, qty, price)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [portfolio.id, order.id, normalizedSymbol, side, qty, fillPrice]
      );

      const trade = this.formatTrade(tradeResult.rows[0]);

      await client.query("COMMIT");

      const state = await this.getState();
      return buildState(state);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
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
  buildState,
  DEFAULT_SLIPPAGE,
};
