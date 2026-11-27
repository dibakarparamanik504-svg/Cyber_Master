import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getSafeReturnPath } from "../auth/redirect";
import { useAuth } from "../auth/AuthContext";
import "./AuthPage.css";

function Signup() {
  const { user, loading: authLoading, signUp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirmation: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) {
    return <main className="auth-page"><p className="auth-loading">Checking your session...</p></main>;
  }
  if (user) {
    return <Navigate to="/profile" replace />;
  }

  const updateField = (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await signUp(form);
      navigate(getSafeReturnPath(location.search), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="signup-title">
        <span className="auth-eyebrow">PULSELINE AI ACCOUNT</span>
        <h1 id="signup-title">Create your account</h1>
        <p className="auth-description">
          Use your account to securely view your profile on this device.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="signup-name">Full name</label>
          <input
            autoComplete="name"
            autoFocus
            id="signup-name"
            name="name"
            onChange={updateField}
            required
            value={form.name}
          />

          <label htmlFor="signup-email">Email address</label>
          <input
            autoComplete="email"
            id="signup-email"
            name="email"
            onChange={updateField}
            required
            type="email"
            value={form.email}
          />

          <label htmlFor="signup-phone">Phone number (optional)</label>
          <input
            autoComplete="tel"
            id="signup-phone"
            name="phone"
            onChange={updateField}
            type="tel"
            value={form.phone}
          />

          <label htmlFor="signup-password">Password</label>
          <input
            autoComplete="new-password"
            id="signup-password"
            name="password"
            onChange={updateField}
            required
            type="password"
            value={form.password}
          />
          <small className="auth-password-hint">
            Use at least 8 characters and avoid common passwords.
          </small>

          <label htmlFor="signup-password-confirmation">Confirm password</label>
          <input
            autoComplete="new-password"
            id="signup-password-confirmation"
            name="passwordConfirmation"
            onChange={updateField}
            required
            type="password"
            value={form.passwordConfirmation}
          />

          <button disabled={submitting} type="submit">
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        {error && <p className="auth-message" role="alert">{error}</p>}
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default Signup;
