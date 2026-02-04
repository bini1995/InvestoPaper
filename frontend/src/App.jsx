import { useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function App() {
  const [status, setStatus] = useState({ state: "loading" });

  useEffect(() => {
    let isMounted = true;

    fetch(`${backendUrl}/health`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setStatus({ state: "ok", data });
      })
      .catch((error) => {
        if (!isMounted) return;
        setStatus({ state: "error", error: error.message });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page">
      <header>
        <h1>InvestoPaper</h1>
        <p>AI-assisted paper trading and news copilot</p>
      </header>

      <section className="card">
        <h2>Backend health</h2>
        {status.state === "loading" && <p>Checking backend...</p>}
        {status.state === "error" && (
          <p className="error">Error: {status.error}</p>
        )}
        {status.state === "ok" && (
          <div className="ok">
            <p>ok: {String(status.data.ok)}</p>
            <p>time: {status.data.time}</p>
          </div>
        )}
      </section>
    </div>
  );
}
