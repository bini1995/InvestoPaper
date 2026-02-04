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
                    <p className="muted">
                      {entry.payload?.text || "No details available."}
                    </p>
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
