import Card from "../components/Card.jsx";

export default function Login() {
  return (
    <div className="stack">
      <Card title="Login">
        <p className="muted">
          Authentication is optional for this MVP. Use this page as a placeholder
          for future sign-in flows.
        </p>
        <div className="stack-sm">
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="you@example.com"
              disabled
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              placeholder="••••••••"
              disabled
            />
          </div>
          <button className="button button-primary" type="button" disabled>
            Sign in (coming soon)
          </button>
        </div>
      </Card>
    </div>
  );
}
