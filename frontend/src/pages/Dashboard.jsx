import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function Dashboard() {
  const [symbol, setSymbol] = useState("SPY");
  const [health, setHealth] = useState({ state: "loading" });
  const [portfolio, setPortfolio] = useState({ state: "loading" });
  const [plan, setPlan] = useState({ state: "loading" });
  const [news, setNews] = useState({ state: "loading" });

  const loadDashboard = useCallback(async () => {
    setHealth({ state: "loading" });
    setPortfolio({ state: "loading" });
    setPlan({ state: "loading" });
    setNews({ state: "loading" });

    const [healthRes, portfolioRes, planRes, newsRes] = await Promise.all([
      getJson("/health"),
      getJson("/api/paper/state"),
      getJson(`/api/plan/today?symbol=${encodeURIComponent(symbol)}`),
      getJson("/api/news?limit=5"),
    ]);

    setHealth(
      healthRes.error
        ? { state: "error", error: healthRes.error }
        : { state: "ok", data: healthRes.data }
    );

    setPortfolio(
      portfolioRes.error
        ? { state: "error", error: portfolioRes.error }
        : { state: "ok", data: portfolioRes.data }
    );

    setPlan(
      planRes.error
        ? { state: "error", error: planRes.error }
        : { state: "ok", data: planRes.data }
    );

    setNews(
      newsRes.error
        ? { state: "error", error: newsRes.error }
        : { state: "ok", data: newsRes.data }
    );
  }, [symbol]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleInitPortfolio = async () => {
    setPortfolio({ state: "loading" });
    const response = await postJson("/api/paper/init", {
      startingCash: 100000,
    });
    if (response.error) {
      setPortfolio({ state: "error", error: response.error });
      return;
    }
    setPortfolio({ state: "ok", data: response.data });
  };

  const planChecklist = useMemo(() => {
    if (plan.state !== "ok") {
      return [];
    }
    return Array.isArray(plan.data?.plan?.checklist)
      ? plan.data.plan.checklist
      : [];
  }, [plan]);

  return (
    <div className="stack">
      <Card
        title="Dashboard"
        action={
          <button className="button" onClick={loadDashboard} type="button">
            Refresh
          </button>
        }
      >
        <div className="dashboard-controls">
          <div className="field">
            <label htmlFor="symbol">Plan symbol</label>
            <input
              id="symbol"
              className="input"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            />
          </div>
          <p className="muted">
            Plan, portfolio, and news data update automatically when you refresh.
          </p>
        </div>
      </Card>

      <div className="grid">
        <Card title="Backend health">
          {health.state === "loading" && <p>Checking backend status…</p>}
          {health.state === "error" && (
            <StatusMessage tone="error">{health.error}</StatusMessage>
          )}
          {health.state === "ok" && (
            <div className="stack-sm">
              <p className="label">Status</p>
              <p className="value">ok: {String(health.data.ok)}</p>
              <p className="label">Time</p>
              <p className="value">{health.data.time}</p>
            </div>
          )}
        </Card>

        <Card
          title="Portfolio state"
          action={
            portfolio.state === "error" &&
            portfolio.error?.toLowerCase().includes("not initialized") ? (
              <button
                className="button button-primary"
                type="button"
                onClick={handleInitPortfolio}
              >
                Initialize
              </button>
            ) : null
          }
        >
          {portfolio.state === "loading" && <p>Loading portfolio…</p>}
          {portfolio.state === "error" && (
            <StatusMessage tone="error">{portfolio.error}</StatusMessage>
          )}
          {portfolio.state === "ok" && (
            <div className="stack-sm">
              <div className="split">
                <div>
                  <p className="label">Cash</p>
                  <p className="value">
                    {formatCurrency(portfolio.data.portfolio?.cash)}
                  </p>
                </div>
                <div>
                  <p className="label">Equity</p>
                  <p className="value">
                    {formatCurrency(portfolio.data.portfolio?.equity)}
                  </p>
                </div>
              </div>
              <div>
                <p className="label">Positions</p>
                {portfolio.data.positions?.length ? (
                  <ul className="list">
                    {portfolio.data.positions.map((position) => (
                      <li key={position.symbol}>
                        <span className="strong">{position.symbol}</span> —
                        {" "}
                        {position.qty} @ {formatCurrency(position.avgPrice)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No open positions.</p>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card title="Today’s plan">
          {plan.state === "loading" && <p>Loading plan…</p>}
          {plan.state === "error" && (
            <StatusMessage tone="error">{plan.error}</StatusMessage>
          )}
          {plan.state === "ok" && (
            <div className="stack-sm">
              <div className="split">
                <div>
                  <p className="label">Signal</p>
                  <p className="value">
                    {plan.data.plan?.signal?.toUpperCase() || "--"}
                  </p>
                </div>
                <div>
                  <p className="label">Risk</p>
                  <p className="value">
                    {plan.data.plan?.risk?.toUpperCase() || "--"}
                  </p>
                </div>
              </div>
              <div>
                <p className="label">Checklist</p>
                {planChecklist.length ? (
                  <ul className="list">
                    {planChecklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No checklist items yet.</p>
                )}
              </div>
              <div className="split">
                <div>
                  <p className="label">Support</p>
                  <p className="value">
                    {plan.data.plan?.keyLevels?.support ?? "--"}
                  </p>
                </div>
                <div>
                  <p className="label">Resistance</p>
                  <p className="value">
                    {plan.data.plan?.keyLevels?.resistance ?? "--"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card title="Latest news">
          {news.state === "loading" && <p>Loading news…</p>}
          {news.state === "error" && (
            <StatusMessage tone="error">{news.error}</StatusMessage>
          )}
          {news.state === "ok" && (
            <div className="stack-sm">
              {news.data.items?.length ? (
                <ul className="list">
                  {news.data.items.map((item) => (
                    <li key={item.id}>
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.title}
                      </a>
                      <div className="muted">
                        {item.source} • {item.publishedAt?.slice(0, 10) || "--"}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No news items yet.</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
