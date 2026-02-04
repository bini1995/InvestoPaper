import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Journal from "./pages/Journal.jsx";
import Login from "./pages/Login.jsx";
import ManualExecution from "./pages/ManualExecution.jsx";
import PaperTrade from "./pages/PaperTrade.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <div>
            <p className="eyebrow">InvestoPaper</p>
            <h1>Paper trading cockpit</h1>
          </div>
          <p className="muted">
            Monitor the backend, review the daily plan, trade, and capture
            journal notes.
          </p>
        </header>

        <nav className="nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/paper">Paper Trade</NavLink>
          <NavLink to="/manual">Manual Execution</NavLink>
          <NavLink to="/journal">Journal</NavLink>
          <NavLink to="/login">Login</NavLink>
        </nav>

        <main className="page">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/paper" element={<PaperTrade />} />
            <Route path="/manual" element={<ManualExecution />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
