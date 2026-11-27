import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./profile.css";

function Profile() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="profile-page">
        <p className="profile-message" role="status">Loading your profile...</p>
      </main>
    );
  }

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return (
    <main className="profile-page">
      <section className="profile-card" aria-labelledby="profile-title">
        <span className="profile-eyebrow">PULSELINE AI</span>
        <h1 id="profile-title">My Profile</h1>
        <p className="profile-description">
          Your account details are securely loaded from your PULSELINE account.
          Profile information is view-only.
        </p>

        <dl className="profile-details">
          <div>
            <dt>Full name</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>Email address</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Phone number</dt>
            <dd>{user.phone || "Not provided"}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>
              {user.dateJoined
                ? new Date(user.dateJoined).toLocaleDateString()
                : "Unavailable"}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

export default Profile;
