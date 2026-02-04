import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import { getJson, postJson } from "../api.js";

const formatCurrency = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })
    : "--";

const toInputValue = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "";

const parseNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function ManualExecution() {
  const [symbol, setSymbol] = useState("SPY");
  const [plan, setPlan] = useState({ state: "loading" });
  const [portfolio, setPortfolio] = useState({ state: "loading" });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    entry: "",
    stopLoss: "",
    takeProfit: "",
    quantity: "",
    notes: "",
  });
  const [checklistState, setChecklistState] = useState([]);

  const loadManualPlan = useCallback(async () => {
    setPlan({ state: "loading" });
    setPortfolio({ state: "loading" });
    setMessage(null);

    const [planRes, portfolioRes] = await Promise.all([
      getJson(`/api/plan/today?symbol=${encodeURIComponent(symbol)}`),
      getJson("/api/paper/state"),
    ]);

    setPlan(
      planRes.error
        ? { state: "error", error: planRes.error }
        : { state: "ok", data: planRes.data }
    );

    setPortfolio(
      portfolioRes.error
        ? { state: "error", error: portfolioRes.error }
        : { state: "ok", data: portfolioRes.data }
    );
  }, [symbol]);

  useEffect(() => {
    loadManualPlan();
  }, [loadManualPlan]);

  const risk = plan.state === "ok" ? plan.data?.plan?.risk : null;
  const checklist = useMemo(() => {
    if (plan.state !== "ok") {
      return [];
    }
    return Array.isArray(plan.data?.plan?.checklist)
      ? plan.data.plan.checklist
      : [];
  }, [plan]);

  useEffect(() => {
    if (plan.state !== "ok") {
      return;
    }
    setForm({
      entry: toInputValue(risk?.entry),
      stopLoss: toInputValue(risk?.stopLoss),
      takeProfit: toInputValue(risk?.takeProfit),
      quantity: "",
      notes: "",
    });
    setChecklistState(checklist.map((item) => ({ text: item, checked: false })));
  }, [plan.state, risk?.entry, risk?.stopLoss, risk?.takeProfit, checklist]);

  const startingCash =
    portfolio.state === "ok"
      ? portfolio.data?.portfolio?.startingCash ??
        portfolio.data?.portfolio?.cash
      : null;

  const maxLoss = useMemo(() => {
    const pct = risk?.positionSizePct;
    if (!Number.isFinite(startingCash) || !Number.isFinite(pct)) {
      return null;
    }
    return startingCash * pct;
  }, [risk?.positionSizePct, startingCash]);

  const handleChecklistToggle = (index) => {
    setChecklistState((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setMessage(null);
    setSaving(true);

    const payload = {
      symbol,
      planDate: plan.state === "ok" ? plan.data?.date : null,
      planSignal: plan.state === "ok" ? plan.data?.plan?.signal : null,
      suggested: {
        entry: risk?.entry ?? null,
        stopLoss: risk?.stopLoss ?? null,
        takeProfit: risk?.takeProfit ?? null,
        positionSizePct: risk?.positionSizePct ?? null,
        maxLossDollars: maxLoss,
      },
      executed: {
        entry: parseNumber(form.entry),
        stopLoss: parseNumber(form.stopLoss),
        takeProfit: parseNumber(form.takeProfit),
        quantity: parseNumber(form.quantity),
      },
      checklist: checklistState,
      notes: form.notes.trim(),
      startingCash,
    };

    const response = await postJson("/api/journal", {
      type: "manual_trade",
      payload,
    });

    if (response.error) {
      setMessage({ tone: "error", text: response.error });
      setSaving(false);
      return;
    }

    setSaving(false);
    setMessage({ tone: "success", text: "Manual trade logged." });
  };

  return (
    <div className="stack">
      <Card
        title="Manual Execution"
        action={
          <button className="button" onClick={loadManualPlan} type="button">
            Refresh plan
          </button>
        }
      >
        {message && (
          <StatusMessage tone={message.tone}>{message.text}</StatusMessage>
        )}
        <div className="dashboard-controls">
          <div className="field">
            <label htmlFor="manual-symbol">Plan symbol</label>
            <input
              id="manual-symbol"
              className="input"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            />
          </div>
          <p className="muted">
            Use the daily plan to build a step-by-step trade card for Robinhood.
          </p>
        </div>
      </Card>

      <div className="grid">
        <Card title="Robinhood trade card">
          {plan.state === "loading" && <p>Loading plan…</p>}
          {plan.state === "error" && (
            <StatusMessage tone="error">{plan.error}</StatusMessage>
          )}
          {plan.state === "ok" && (
            <div className="trade-card stack-sm">
              <div className="trade-header">
                <div>
                  <p className="label">Symbol</p>
                  <p className="value">{plan.data?.symbol || symbol}</p>
                </div>
                <div>
                  <p className="label">Signal</p>
                  <p className="value">
                    {plan.data?.plan?.signal?.toUpperCase() || "--"}
                  </p>
                </div>
                <div>
                  <p className="label">Plan date</p>
                  <p className="value">{plan.data?.date || "--"}</p>
                </div>
              </div>

              <div className="trade-metrics">
                <div className="metric">
                  <p className="label">Suggested entry</p>
                  <p className="value">{formatCurrency(risk?.entry)}</p>
                </div>
                <div className="metric">
                  <p className="label">Stop loss</p>
                  <p className="value">{formatCurrency(risk?.stopLoss)}</p>
                </div>
                <div className="metric">
                  <p className="label">Take profit</p>
                  <p className="value">{formatCurrency(risk?.takeProfit)}</p>
                </div>
                <div className="metric">
                  <p className="label">Max loss per trade</p>
                  <p className="value">{formatCurrency(maxLoss)}</p>
                  <p className="muted">
                    Based on starting cash & position sizing.
                  </p>
                </div>
              </div>

              <div>
                <p className="label">Checklist</p>
                {checklistState.length ? (
                  <ul className="checklist">
                    {checklistState.map((item, index) => (
                      <li key={item.text} className="checklist-item">
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleChecklistToggle(index)}
                          />
                          <span>{item.text}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No checklist items yet.</p>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card title="Execution details">
          {portfolio.state === "loading" && <p>Loading portfolio…</p>}
          {portfolio.state === "error" && (
            <StatusMessage tone="error">{portfolio.error}</StatusMessage>
          )}
          {portfolio.state === "ok" && (
            <div className="stack-sm">
              <p className="muted">
                Starting cash: {formatCurrency(startingCash)}
              </p>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="manual-entry">Executed entry</label>
                  <input
                    id="manual-entry"
                    className="input"
                    value={form.entry}
                    onChange={handleChange("entry")}
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label htmlFor="manual-stop">Executed stop loss</label>
                  <input
                    id="manual-stop"
                    className="input"
                    value={form.stopLoss}
                    onChange={handleChange("stopLoss")}
                    inputMode="decimal"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="manual-take">Executed take profit</label>
                  <input
                    id="manual-take"
                    className="input"
                    value={form.takeProfit}
                    onChange={handleChange("takeProfit")}
                    inputMode="decimal"
                  />
                </div>
                <div className="field">
                  <label htmlFor="manual-qty">Quantity</label>
                  <input
                    id="manual-qty"
                    className="input"
                    value={form.quantity}
                    onChange={handleChange("quantity")}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="manual-notes">Execution notes</label>
                <textarea
                  id="manual-notes"
                  className="input"
                  rows="4"
                  value={form.notes}
                  onChange={handleChange("notes")}
                  placeholder="Capture fills, tweaks, or anything you noticed."
                />
              </div>
              <button
                className="button button-primary button-hero"
                type="button"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Logging…" : "I executed this manually"}
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
