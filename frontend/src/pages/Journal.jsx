import { useEffect, useState } from "react";
import Card from "../components/Card.jsx";
import StatusMessage from "../components/StatusMessage.jsx";
import { getJson, postJson } from "../api.js";

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatCurrency = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })
    : "--";

const renderManualTrade = (payload) => {
  if (!payload) {
    return <p className="muted">No details available.</p>;
  }

  return (
    <div className="stack-sm">
      <div className="split">
        <span className="strong">{payload.symbol || "--"}</span>
        <span className="muted">{payload.planSignal || "--"}</span>
      </div>
      <div className="split">
        <span className="label">Executed entry</span>
        <span>{formatCurrency(payload.executed?.entry)}</span>
      </div>
      <div className="split">
        <span className="label">Stop loss</span>
        <span>{formatCurrency(payload.executed?.stopLoss)}</span>
      </div>
      <div className="split">
        <span className="label">Take profit</span>
        <span>{formatCurrency(payload.executed?.takeProfit)}</span>
      </div>
      <div className="split">
        <span className="label">Quantity</span>
        <span>{payload.executed?.quantity ?? "--"}</span>
      </div>
      <div>
        <p className="label">Checklist</p>
        {Array.isArray(payload.checklist) && payload.checklist.length ? (
          <ul className="list">
            {payload.checklist.map((item) => (
              <li key={item.text}>
                {item.checked ? "✅" : "⬜"} {item.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No checklist saved.</p>
        )}
      </div>
      {payload.notes ? (
        <p className="muted">Notes: {payload.notes}</p>
      ) : (
        <p className="muted">No notes provided.</p>
      )}
    </div>
  );
};

export default function Journal() {
  const [entries, setEntries] = useState({ state: "loading" });
  const [note, setNote] = useState("");
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadEntries = async () => {
    setEntries({ state: "loading" });
    const response = await getJson("/api/journal?limit=20");
    if (response.error) {
      setEntries({ state: "error", error: response.error });
      return;
    }
    setEntries({ state: "ok", data: response.data.entries || [] });
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    const trimmed = note.trim();
    if (!trimmed) {
      setMessage({ tone: "error", text: "Please enter a note." });
      return;
    }

    setSaving(true);
    const response = await postJson("/api/journal", {
      type: "note",
      payload: { text: trimmed },
    });

    if (response.error) {
      setMessage({ tone: "error", text: response.error });
      setSaving(false);
      return;
    }

    setNote("");
    setMessage({ tone: "success", text: "Note saved." });
    setSaving(false);
    loadEntries();
  };

  return (
    <div className="stack">
      <Card title="Journal">
        {message && (
          <StatusMessage tone={message.tone}>{message.text}</StatusMessage>
        )}
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="journal-note">Add a note</label>
            <textarea
              id="journal-note"
              className="input"
              rows="4"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Capture trade thoughts, observations, or reminders."
            />
          </div>
          <button className="button button-primary" disabled={saving}>
            {saving ? "Saving…" : "Save note"}
          </button>
        </form>
      </Card>

      <Card title="Recent entries">
        {entries.state === "loading" && <p>Loading journal…</p>}
        {entries.state === "error" && (
          <StatusMessage tone="error">{entries.error}</StatusMessage>
        )}
        {entries.state === "ok" && (
          <div className="stack-sm">
            {entries.data.length ? (
              <ul className="list">
                {entries.data.map((entry) => (
                  <li key={entry.id}>
                    <div className="split">
                      <span className="strong">{entry.type}</span>
                      <span className="muted">{formatDate(entry.createdAt)}</span>
                    </div>
                    {entry.type === "manual_trade" ? (
                      renderManualTrade(entry.payload)
                    ) : (
                      <p className="muted">
                        {entry.payload?.text || "No details available."}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No journal entries yet.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
