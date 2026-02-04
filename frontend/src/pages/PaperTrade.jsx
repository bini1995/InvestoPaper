import { useEffect, useState } from "react";
import Card from "../components/Card.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import { getJson, postJson } from "../api.js";

const formatCurrency = (value) =>
  typeof value === "number"
    ? value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })
    : "--";

export default function PaperTrade() {
  const [state, setState] = useState({ status: "loading" });
  const [form, setForm] = useState({
    symbol: "SPY",
    qty: 1,
    side: "buy",
    lastPrice: "",
  });
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadState = async () => {
    setState({ status: "loading" });
    const response = await getJson("/api/paper/state");
    if (response.error) {
      setState({ status: "error", error: response.error });
      return;
    }
    setState({ status: "ok", data: response.data });
  };

  useEffect(() => {
    loadState();
  }, []);

  const handleInitPortfolio = async () => {
    setState({ status: "loading" });
    const response = await postJson("/api/paper/init", {
      startingCash: 100000,
    });
    if (response.error) {
      setState({ status: "error", error: response.error });
      return;
    }
    setState({ status: "ok", data: response.data });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const trimmedSymbol = form.symbol.trim().toUpperCase();
    if (!trimmedSymbol) {
      setMessage({ tone: "error", text: "Symbol is required." });
      setSubmitting(false);
      return;
    }

    if (form.lastPrice) {
      const priceValue = Number(form.lastPrice);
      if (!Number.isFinite(priceValue) || priceValue <= 0) {
        setMessage({
          tone: "error",
          text: "Last price must be a positive number.",
        });
        setSubmitting(false);
        return;
      }

      const markRes = await postJson("/api/paper/mark-to-market", {
        prices: { [trimmedSymbol]: priceValue },
      });

      if (markRes.error) {
        setMessage({ tone: "error", text: markRes.error });
        setSubmitting(false);
        return;
      }
    }

    const orderRes = await postJson("/api/paper/order", {
      symbol: trimmedSymbol,
      qty: Number(form.qty),
      side: form.side,
      type: "market",
    });

    if (orderRes.error) {
      setMessage({ tone: "error", text: orderRes.error });
      setSubmitting(false);
      return;
    }

    setState({ status: "ok", data: orderRes.data });
    setMessage({ tone: "success", text: "Order placed successfully." });
    setSubmitting(false);
  };

  return (
    <div className="stack">
      <Card title="Paper trade">
        {state.status === "error" && (
          <StatusMessage tone="error">{state.error}</StatusMessage>
        )}
        {state.status === "error" &&
        state.error?.toLowerCase().includes("not initialized") ? (
          <button
            className="button button-primary"
            type="button"
            onClick={handleInitPortfolio}
          >
            Initialize paper portfolio
          </button>
        ) : null}
        {message && (
          <StatusMessage tone={message.tone}>{message.text}</StatusMessage>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="trade-symbol">Symbol</label>
              <input
                id="trade-symbol"
                className="input"
                value={form.symbol}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    symbol: event.target.value,
                  }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="trade-qty">Quantity</label>
              <input
                id="trade-qty"
                className="input"
                type="number"
                min="1"
                value={form.qty}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    qty: event.target.value,
                  }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="trade-side">Side</label>
              <select
                id="trade-side"
                className="input"
                value={form.side}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    side: event.target.value,
                  }))
                }
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="trade-price">Last price (optional)</label>
              <input
                id="trade-price"
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={form.lastPrice}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    lastPrice: event.target.value,
                  }))
                }
                placeholder="Set a price before trading"
              />
            </div>
          </div>
          <button
            className="button button-primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>
        </form>
      </Card>

      <Card title="Positions">
        {state.status === "loading" && <p>Loading positions…</p>}
        {state.status === "ok" && (
          <div className="stack-sm">
            <div className="split">
              <div>
                <p className="label">Cash</p>
                <p className="value">
                  {formatCurrency(state.data.portfolio?.cash)}
                </p>
              </div>
              <div>
                <p className="label">Equity</p>
                <p className="value">
                  {formatCurrency(state.data.portfolio?.equity)}
                </p>
              </div>
            </div>
            {state.data.positions?.length ? (
              <ul className="list">
                {state.data.positions.map((position) => (
                  <li key={position.symbol}>
                    <span className="strong">{position.symbol}</span> —
                    {" "}
                    {position.qty} @ {formatCurrency(position.avgPrice)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No open positions yet.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
