import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./header.css";

const navigation = [
  { label: "Home", to: "/", end: true },
  { label: "Appointment", to: "/appointment" },
  { label: "AI Assistant", to: "/ai-assistant" },
  { label: "Live Queue", to: "/live-queue" },
  { label: "Departments", to: "/departments" },
];

function Header() {
  const { user, loading, authError, signOut } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");

  const handleSignOut = async () => {
    setLogoutError("");
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      setLogoutError(error.message);
    }
  };

  return (
    <header className="app-header">
      <NavLink className="app-header-brand" to="/" aria-label="PULSELINE AI home">
        <span className="app-header-brand-icon" aria-hidden="true">
          ✚
        </span>
        <span>
          <strong>
            PULSELINE <b>AI</b>
          </strong>
          <small>SMART HEALTHCARE</small>
        </span>
      </NavLink>

      <nav className="app-header-navigation" aria-label="Main navigation">
        {navigation.map(({ label, to, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              isActive
                ? "app-header-navigation-link active"
                : "app-header-navigation-link"
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="app-header-account">
        {loading ? (
          <span className="app-header-auth-status">Checking account...</span>
        ) : user ? (
          <>
            <NavLink
              className={({ isActive }) =>
                isActive
                  ? "app-header-profile active"
                  : "app-header-profile"
              }
              to="/profile"
            >
              <span aria-hidden="true">◉</span>
              Profile
            </NavLink>
            <button
              className="app-header-signout"
              onClick={handleSignOut}
              type="button"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <NavLink className="app-header-signin" to="/login">
              Sign in
            </NavLink>
            <NavLink className="app-header-signup" to="/signup">
              Sign up
            </NavLink>
          </>
        )}
      </div>
      {(authError || logoutError) && (
        <span className="app-header-error" role="status">
          {logoutError || authError}
        </span>
      )}
    </header>
  );
}

export default Header;
