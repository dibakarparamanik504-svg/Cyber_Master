import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getSafeReturnPath } from "../auth/redirect";
import { useAuth } from "../auth/AuthContext";
import "./AuthPage.css";

function Login() {
  const { user, loading: authLoading, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) {
    return <main className="auth-page"><p className="auth-loading">Checking your session...</p></main>;
  }
  if (user) {
    return <Navigate to="/profile" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await signIn({ email, password });
      navigate(getSafeReturnPath(location.search), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <span className="auth-eyebrow">PULSELINE AI ACCOUNT</span>
        <h1 id="login-title">Sign in</h1>
        <p className="auth-description">
          Sign in to view your account profile.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address</label>
          <input
            autoComplete="username"
            autoFocus
            id="login-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />

          <label htmlFor="login-password">Password</label>
          <input
            autoComplete="current-password"
            id="login-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />

          <button disabled={submitting} type="submit">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {error && <p className="auth-message" role="alert">{error}</p>}
        <p className="auth-switch">
          New to PULSELINE AI? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
