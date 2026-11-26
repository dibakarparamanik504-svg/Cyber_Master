
import React, { useEffect, useRef, useState } from "react";
import "./Live_queue.css";

const API_URL = (process.env.REACT_APP_API_URL || "/api").replace(/\/$/, "");

const timelineSteps = [
  { key: "generated", label: "Token Generated", icon: "✓" },
  { key: "waiting", label: "Waiting in Queue", icon: "◷" },
  { key: "next", label: "Next in Line", icon: "↗" },
  { key: "serving", label: "Service in Progress", icon: "✚" },
  { key: "completed", label: "Service Completed", icon: "✓" },
];

const intelligenceFeatures = [
  ["◈", "Queue Congestion Detection", "Identify queues experiencing unusually high patient volume."],
  ["◷", "Unusual Waiting-Time Detection", "Highlight waiting times that exceed expected patterns."],
  ["⌕", "Patient Flow Bottleneck Analysis", "Identify stages where patient movement slows down."],
  ["↔", "Queue Load Balancing", "Recommend distributing workload across available service counters."],
  ["⌁", "Service Delay Pattern Analysis", "Study recurring causes of queue delays."],
  ["▥", "Peak Queue Period Forecasting", "Forecast busy periods from historical queue records."],
];

const initialNotifications = [
  "Queue position updated",
  "Your turn is approaching",
  "Service has started",
  "Queue delay detected",
  "Service completed",
];

function getTimelineIndex(status) {
  const statusMap = {
    generated: 0,
    waiting: 1,
    next: 2,
    serving: 3,
    completed: 4,
  };

  return statusMap[status] ?? 1;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || `Queue request failed (${response.status}).`);
  }
  return data;
}

function LiveQueue() {
  const query = new URLSearchParams(window.location.search);
  const [summary, setSummary] = useState(null);
  const [queue, setQueue] = useState(null);
  const [reference, setReference] = useState(query.get("reference") || "");
  const [verification, setVerification] = useState(query.get("verification") || "");
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => "Notification" in window && Notification.permission === "granted"
  );
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const [analytics, setAnalytics] = useState(null);

  const previousQueueRef = useRef(null);

  useEffect(() => {
    let active = true;
    const refreshDashboard = async () => {
      try {
        const [summaryData, analyticsData] = await Promise.all([
          apiRequest("/queue/summary/"),
          apiRequest("/queue/analytics/"),
        ]);
        if (!active) return;
        setSummary(summaryData);
        setAnalytics(analyticsData);
        setConnectionStatus("connected");
        setLastUpdated(new Date());
      } catch (requestError) {
        if (!active) return;
        setConnectionStatus("disconnected");
        setError(requestError.message);
      }
    };

    refreshDashboard();
    const refreshInterval = window.setInterval(refreshDashboard, 30000);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, []);

  const trackQueue = async (event) => {
    event.preventDefault();

    if (!reference.trim()) {
      setError("Please enter your queue reference.");
      return;
    }

    if (!verification.trim()) {
      setError("Enter the verification code to access your queue.");
      return;
    }

    setTracking(true);
    setError("");
    setQueue(null);

    try {
      const data = await apiRequest("/queue/track/", {
        method: "POST",
        body: JSON.stringify({
          reference: reference.trim(),
          verification_code: verification.trim(),
        }),
      });
      previousQueueRef.current = data;
      setQueue(data);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setTracking(false);
    }
  };

  const requestBrowserNotifications = async () => {
    if (!("Notification" in window)) {
      setError("Browser notifications are not supported.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        new Notification("PULSELINE", {
          body: "Queue status notifications are enabled for this browser.",
        });
      } else {
        setNotificationsEnabled(false);
        setError("Notification permission was not granted.");
      }
    } catch (notificationError) {
      setNotificationsEnabled(false);
      setError(notificationError.message || "Could not enable notifications.");
    }
  };

  useEffect(() => {
    if (!queue?.token || !verification.trim()) return undefined;
    let active = true;
    const refreshTrackedQueue = async () => {
      try {
        const data = await apiRequest("/queue/track/", {
          method: "POST",
          body: JSON.stringify({
            reference: queue.token,
            verification_code: verification.trim(),
          }),
        });
        if (!active) return;

        const previous = previousQueueRef.current;
        if (
          notificationsEnabled &&
          previous &&
          (previous.status !== data.status ||
            previous.position !== data.position) &&
          Notification.permission === "granted"
        ) {
          new Notification("PULSELINE Queue Update", {
            body: `Status: ${getStatusLabel(data.status)}. Patients ahead: ${data.patients_ahead}.`,
          });
        }

        previousQueueRef.current = data;
        setQueue(data);
        setLastUpdated(new Date());
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    };

    const refreshInterval = window.setInterval(refreshTrackedQueue, 30000);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, [queue?.token, verification, notificationsEnabled]);

  const formatUpdatedTime = (value) => {
    if (!value) return "Not updated yet";

    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      generated: "Token Generated",
      waiting: "Waiting",
      next: "Next in Line",
      serving: "Service in Progress",
      completed: "Completed",
    };

    return labels[status] || "Waiting";
  };

  const timelineIndex = queue ? getTimelineIndex(queue.status) : 0;

  const maxHourlyVolume = Math.max(
    ...(analytics?.hourly_volume || []).map((item) => item.value),
    1
  );

  return (
    <div
      className={`smartq-queue-page ${
        largeText ? "queue-large-text" : ""
      } ${highContrast ? "queue-high-contrast" : ""} ${
        accessibleMode ? "queue-accessible-mode" : ""
      }`}
    >
      {/* NAVIGATION */}
      <header className="queue-navbar">
        <a href="/" className="queue-brand">
          <span className="queue-brand-icon">✚</span>
          <span>
            <strong>PULSELINE <b>AI</b></strong>
            <small>INTELLIGENT HEALTHCARE</small>
          </span>
        </a>

        <nav className="queue-nav-links">
          <a href="/">HOME</a>
          <a href="/appointment">APPOINTMENT</a>
          <a href="/ai-assistant">AI ASSISTANT</a>
          <a href="/live-queue" className="queue-nav-active">
            LIVE QUEUE
          </a>
          <a href="/departments">DEPARTMENTS</a>
        </nav>

        <div className="queue-connection">
          <span
            className={`queue-connection-dot ${connectionStatus}`}
          ></span>
          {connectionStatus === "connected"
            ? "CONNECTED"
            : "NOT CONNECTED"}
        </div>
      </header>

      <main>
        {/* 01 HERO */}
        <section className="queue-hero">
          <div className="queue-hero-content">
            <span className="queue-eyebrow">
              REAL-TIME QUEUE MONITORING
            </span>

            <h1>
              Real-Time
              <span> Hospital Queue</span>
            </h1>

            <p>
              Monitor your queue position, track service progress
              and receive intelligent waiting-time updates through
              PULSELINE.
            </p>

            <div className="queue-hero-tags">
              <span><i></i> Live Monitoring</span>
              <span>◷ Waiting-Time Intelligence</span>
              <span>↻ Automatic Updates</span>
            </div>

            <a href="#queue-tracker" className="queue-primary-button">
              Track My Queue <span>→</span>
            </a>
          </div>

          <div className="queue-hero-visual">
            <div className="queue-visual-card">
              <div className="queue-visual-top">
                <span>QUEUE MONITOR</span>
                <span className="queue-live-label"><i></i> LIVE</span>
              </div>
              <div className="queue-visual-token">
                <small>CURRENTLY SERVING</small>
                <strong>A097</strong>
                <span>Service Counter 01</span>
              </div>
              <div className="queue-visual-bottom">
                <div>
                  <small>WAITING</small>
                  <strong>42</strong>
                </div>
                <div>
                  <small>ACTIVE QUEUES</small>
                  <strong>08</strong>
                </div>
                <div>
                  <small>COMPLETED</small>
                  <strong>128</strong>
                </div>
              </div>
            </div>
            <div className="queue-floating-label">
              <span>✦</span> Smart Queue Intelligence
            </div>
          </div>
        </section>

        {/* 02 SUMMARY */}
        <section className="queue-section">
          <div className="queue-section-heading">
            <span className="queue-eyebrow">02 — LIVE QUEUE OVERVIEW</span>
            <h2>Hospital Queue Summary</h2>
            <p>Queue-wide figures supplied by the hospital queue system.</p>
          </div>

          <div className="queue-summary-grid">
            <div className="queue-summary-card">
              <span className="queue-summary-icon">▤</span>
              <small>Total Active Queues</small>
              <strong>{summary?.active_queues ?? "—"}</strong>
              <span className="queue-card-caption">Active queue groups</span>
            </div>

            <div className="queue-summary-card">
              <span className="queue-summary-icon">◷</span>
              <small>Patients Waiting</small>
              <strong>{summary?.patients_waiting ?? "—"}</strong>
              <span className="queue-card-caption">Across active queues</span>
            </div>

            <div className="queue-summary-card">
              <span className="queue-summary-icon">✚</span>
              <small>Currently Serving</small>
              <strong>{summary?.currently_serving ?? "—"}</strong>
              <span className="queue-card-caption">Service in progress</span>
            </div>

            <div className="queue-summary-card">
              <span className="queue-summary-icon">✓</span>
              <small>Completed Today</small>
              <strong>{summary?.completed_today ?? "—"}</strong>
              <span className="queue-card-caption">Completed tokens</span>
            </div>
          </div>
        </section>

        {/* 03 PERSONAL TRACKER */}
        <section className="queue-section queue-section-soft" id="queue-tracker">
          <div className="queue-section-heading">
            <span className="queue-eyebrow">03 — PERSONAL QUEUE TRACKER</span>
            <h2>Track Your Queue Position</h2>
            <p>
              Enter your queue reference and complete secure
              verification to view personal queue information.
            </p>
          </div>

          <form className="queue-tracker-form" onSubmit={trackQueue}>
            <div className="queue-form-field">
              <label htmlFor="queue-reference">QUEUE REFERENCE</label>
              <input
                id="queue-reference"
                type="text"
                placeholder="Enter your queue token number..."
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div className="queue-form-field">
              <label htmlFor="queue-verification">
                VERIFICATION CODE
              </label>
              <input
                id="queue-verification"
                type="password"
                placeholder="Enter verification code"
                value={verification}
                onChange={(event) => setVerification(event.target.value)}
                autoComplete="one-time-code"
                required
              />
            </div>

            <button
              type="submit"
              className="queue-primary-button"
              disabled={tracking}
            >
              {tracking ? "Tracking..." : "Track My Queue"}
              <span>→</span>
            </button>

            <p className="queue-form-note">
              🔒 Patient-specific information is displayed only
              after verification by the connected backend.
            </p>
          </form>

          {error && (
            <div className="queue-error" role="alert">
              {error}
              <button type="button" onClick={() => setError("")}>×</button>
            </div>
          )}
        </section>

        {/* 04 TOKEN STATUS */}
        <section className="queue-section">
          <div className="queue-section-heading">
            <span className="queue-eyebrow">04 — LIVE TOKEN STATUS</span>
            <h2>Your Queue Status</h2>
            <p>
              Your personal queue details appear here after successful
              token tracking.
            </p>
          </div>

          {!queue ? (
            <div className="queue-empty-state">
              <span>◷</span>
              <h3>No Queue Selected</h3>
              <p>
                Enter your queue reference above to see your token
                position and service progress.
              </p>
            </div>
          ) : (
            <div className="queue-token-dashboard">
              <div className="queue-token-main">
                <div className="queue-token-top">
                  <span>YOUR TOKEN NUMBER</span>
                  <span className={`queue-status-pill ${queue.status}`}>
                    {getStatusLabel(queue.status)}
                  </span>
                </div>

                <strong className="queue-token-number">
                  #{queue.token}
                </strong>

                <div className="queue-token-stats">
                  <div>
                    <small>QUEUE POSITION</small>
                    <strong>{queue.position ?? "—"}</strong>
                  </div>
                  <div>
                    <small>PATIENTS AHEAD</small>
                    <strong>{queue.patients_ahead ?? "—"}</strong>
                  </div>
                  <div>
                    <small>CURRENT SERVING</small>
                    <strong>{queue.current_serving_token || "—"}</strong>
                  </div>
                </div>
              </div>

              <div className="queue-token-side">
                <span className="queue-side-icon">◷</span>
                <small>ESTIMATED WAITING TIME</small>
                <strong>
                  {queue.estimated_wait_minutes != null
                    ? `${queue.estimated_wait_minutes} min`
                    : "—"}
                </strong>
                <p>Prediction based on available queue data.</p>
              </div>

              <div className="queue-progress-block">
                <div className="queue-progress-heading">
                  <strong>Queue Progress</strong>
                  <span>{queue.progress ?? 0}%</span>
                </div>
                <div
                  className="queue-progress-track"
                  role="progressbar"
                  aria-valuenow={queue.progress ?? 0}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label="Queue progress"
                >
                  <span
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, queue.progress ?? 0)
                      )}%`,
                    }}
                  ></span>
                </div>
                <div className="queue-progress-meta">
                  <span>Token generated</span>
                  <span>Service completed</span>
                </div>
              </div>

              <div className="queue-current-update">
                <span>Last updated</span>
                <strong>
                  {formatUpdatedTime(
                    queue.last_updated || lastUpdated
                  )}
                </strong>
              </div>
            </div>
          )}
        </section>

        {/* 05 PREDICTION */}
        <section className="queue-section queue-section-soft">
          <div className="queue-section-heading">
            <span className="queue-eyebrow">05 — AI WAITING-TIME PREDICTION</span>
            <h2>Intelligent Waiting-Time Estimator</h2>
            <p>
              Prediction indicators should be calculated from actual
              queue history and current service performance.
            </p>
          </div>

          <div className="queue-prediction-grid">
            <div className="queue-prediction-card queue-prediction-highlight">
              <span className="queue-prediction-icon">✦</span>
              <small>AI WAITING-TIME PREDICTION</small>
              <strong>
                {queue?.estimated_wait_minutes != null
                  ? `${queue.estimated_wait_minutes} min`
                  : "—"}
              </strong>
              <p>Estimated time before service begins</p>
            </div>

            <div className="queue-prediction-card">
              <span className="queue-prediction-icon">↗</span>
              <small>DYNAMIC DELAY FORECAST</small>
              <strong>{queue ? "Available" : "—"}</strong>
              <p>Forecast changes as queue conditions change</p>
            </div>

            <div className="queue-prediction-card">
              <span className="queue-prediction-icon">▥</span>
              <small>QUEUE CONGESTION</small>
              <strong>
                {summary
                  ? summary.patients_waiting > 60
                    ? "High"
                    : summary.patients_waiting > 30
                    ? "Moderate"
                    : "Low"
                  : "—"}
              </strong>
              <p>Illustrative threshold; configure with hospital data</p>
            </div>

            <div className="queue-prediction-card">
              <span className="queue-prediction-icon">◉</span>
              <small>PREDICTION CONFIDENCE</small>
              <strong>
                {queue?.prediction_confidence != null
                  ? `${queue.prediction_confidence}%`
                  : "—"}
              </strong>
              <p>Confidence supplied by the prediction model</p>
            </div>
          </div>

          <p className="queue-prediction-note">
            A confidence percentage must come from a calibrated
            prediction model. It must not be guessed or generated
            as a decorative statistic.
          </p>
        </section>

        {/* 06 TIMELINE */}
        <section className="queue-section">
          <div className="queue-section-heading">
            <span className="queue-eyebrow">06 — QUEUE FLOW VISUALIZATION</span>
            <h2>Live Queue Progress</h2>
            <p>Follow each stage of your token's service journey.</p>
          </div>

          <div className="queue-timeline">
            {timelineSteps.map((step, index) => {
              const completed = queue && index <= timelineIndex;
              const current = queue && index === timelineIndex;

              return (
                <div
                  className={`queue-timeline-step ${
                    completed ? "completed" : ""
                  } ${current ? "current" : ""}`}
                  key={step.key}
                >
                  <div className="queue-timeline-marker">
                    {completed ? "✓" : step.icon}
                  </div>
                  <strong>{step.label}</strong>
                  <small>
                    {!queue
                      ? "Awaiting live data"
                      : current
                      ? "Current stage"
                      : completed
                      ? "Completed"
                      : "Upcoming"}
                  </small>
                </div>
              );
            })}
          </div>
        </section>

        {/* 07 INTELLIGENCE */}
        <section className="queue-section queue-section-soft">
          <div className="queue-section-heading">
            <span className="queue-eyebrow">07 — SMART QUEUE INTELLIGENCE</span>
            <h2>Advanced Queue Analytics</h2>
            <p>
              Operational intelligence for identifying queue
              inefficiencies and service delays.
            </p>
          </div>

          <div className="queue-intelligence-grid">
            {intelligenceFeatures.map(([icon, title, description]) => (
              <div className="queue-intelligence-card" key={title}>
                <span>{icon}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 08 NOTIFICATIONS */}
        <section className="queue-section">
          <div className="queue-section-heading">
            <span className="queue-eyebrow">08 — SMART QUEUE NOTIFICATIONS</span>
            <h2>Real-Time Queue Alerts</h2>
            <p>
              Configure browser notification permission for supported
              queue events.
            </p>
          </div>

          <div className="queue-notification-layout">
            <div className="queue-notification-settings">
              <div className="queue-notification-heading">
                <div>
                  <strong>Queue Notifications</strong>
                  <p>Browser notification permission</p>
                </div>
                <label className="queue-toggle">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(event) => {
                      if (event.target.checked) {
                        requestBrowserNotifications();
                      } else {
                        setNotificationsEnabled(false);
                      }
                    }}
                  />
                  <span></span>
                </label>
              </div>

              {initialNotifications.map((item, index) => (
                <div className="queue-notification-item" key={item}>
                  <span>{["↗", "◷", "✚", "⚠", "✓"][index]}</span>
                  {item}
                </div>
              ))}

              <p className="queue-notification-note">
                While this page is open, it checks your verified queue status
                every 30 seconds and can notify you of changes.
              </p>
            </div>

            <div className="queue-notification-preview">
              <span className="queue-preview-icon">🔔</span>
              <small>NOTIFICATION PREVIEW</small>
              <h3>Your turn is approaching</h3>
              <p>
                Your queue position has changed. Please keep your
                token ready and follow the hospital's instructions.
              </p>
              <span className="queue-preview-time">PULSELINE · Preview</span>
            </div>
          </div>
        </section>

        {/* 09 ANALYTICS */}
        <section className="queue-section queue-section-soft">
          <div className="queue-section-heading">
            <span className="queue-eyebrow">09 — QUEUE ANALYTICS</span>
            <h2>Queue Performance Dashboard</h2>
            <p>
              Review historical queue performance and service
              efficiency using recorded operational data.
            </p>
          </div>

          <div className="queue-analytics-summary">
            <div>
              <small>AVERAGE WAITING TIME</small>
              <strong>
                {analytics?.average_wait_minutes != null
                  ? `${analytics.average_wait_minutes} min`
                  : "—"}
              </strong>
            </div>
            <div>
              <small>COMPLETION RATE</small>
              <strong>
                {analytics?.completion_rate != null
                  ? `${analytics.completion_rate}%`
                  : "—"}
              </strong>
            </div>
            <div>
              <small>DELAY FREQUENCY</small>
              <strong>{analytics?.delay_frequency != null
                ? `${analytics.delay_frequency}%`
                : "—"}</strong>
            </div>
          </div>

          <div className="queue-chart-card">
            <div className="queue-chart-heading">
              <div>
                <h3>Hourly Queue Volume</h3>
                <p>Patient volume by hour</p>
              </div>
              <span>Historical data</span>
            </div>

            {analytics?.hourly_volume?.length ? (
              <div
                className="queue-bar-chart"
                role="img"
                aria-label="Hourly queue volume bar chart"
              >
                {analytics.hourly_volume.map((item) => (
                  <div className="queue-bar-column" key={item.time}>
                    <strong>{item.value}</strong>
                    <div className="queue-bar-track">
                      <span
                        style={{
                          height: `${(item.value / maxHourlyVolume) * 100}%`,
                        }}
                      ></span>
                    </div>
                    <small>{item.time}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="queue-empty-chart">
                Analytics will appear when historical data is available.
              </div>
            )}
          </div>

          <div className="queue-analytics-feature-grid">
            {[
              "Average Waiting-Time Trends",
              "Queue Completion Rate",
              "Delay Frequency Analytics",
              "Historical Queue Performance",
              "Queue Efficiency Indicators",
            ].map((item) => (
              <div className="queue-analytics-feature" key={item}>
                <span>✓</span>
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* 10 ACCESSIBILITY */}
        <section className="queue-section">
          <div className="queue-section-heading">
            <span className="queue-eyebrow">10 — DIGITAL QUEUE ACCESSIBILITY</span>
            <h2>Inclusive Queue Experience</h2>
            <p>
              Customize the queue interface to improve readability
              and accessibility.
            </p>
          </div>

          <div className="queue-accessibility-grid">
            <div className="queue-access-card">
              <span>◉</span>
              <strong>Accessible Token Display</strong>
              <p>Clear status and token labels.</p>
            </div>
            <div className="queue-access-card">
              <span>▣</span>
              <strong>Screen Reader-Friendly Status</strong>
              <p>Semantic labels and progress indicators.</p>
            </div>
            <div className="queue-access-card">
              <span>◐</span>
              <strong>High-Contrast Queue View</strong>
              <p>Increase contrast for better visibility.</p>
            </div>
            <div className="queue-access-card">
              <span>A+</span>
              <strong>Large-Text Token Mode</strong>
              <p>Enlarge text and token information.</p>
            </div>
            <div className="queue-access-card">
              <span>文</span>
              <strong>Multilingual Notifications</strong>
              <p>Choose a preferred notification language.</p>
            </div>
          </div>

          <div className="queue-access-settings">
            <div>
              <strong>Display Preferences</strong>
              <p>Adjust your queue screen appearance.</p>
            </div>

            <label className="queue-toggle-row">
              <span>Large Text</span>
              <input
                type="checkbox"
                checked={largeText}
                onChange={(event) => setLargeText(event.target.checked)}
              />
            </label>

            <label className="queue-toggle-row">
              <span>High Contrast</span>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(event) => setHighContrast(event.target.checked)}
              />
            </label>

            <label className="queue-toggle-row">
              <span>Enhanced Accessibility</span>
              <input
                type="checkbox"
                checked={accessibleMode}
                onChange={(event) => setAccessibleMode(event.target.checked)}
              />
            </label>

            <div className="queue-language-setting">
              <label htmlFor="queue-language">Notification Language</label>
              <select
                id="queue-language"
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
              >
                <option>English</option>
                <option>বাংলা</option>
                <option>हिन्दी</option>
                <option>ଓଡ଼ିଆ</option>
                <option>தமிழ்</option>
                <option>తెలుగు</option>
              </select>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="queue-footer">
        <div className="queue-footer-main">
          <div>
            <a href="/" className="queue-brand">
              <span className="queue-brand-icon">✚</span>
              <span>
                <strong>PULSELINE <b>AI</b></strong>
                <small>INTELLIGENT HEALTHCARE</small>
              </span>
            </a>
            <p>
              Real-time tracking · Predictive intelligence ·
              Smart queue monitoring
            </p>
          </div>

          <div className="queue-footer-links">
            <strong>Navigation</strong>
            <a href="/">Home</a>
            <a href="/appointment">Appointment</a>
            <a href="/ai-assistant">AI Assistant</a>
            <a href="/departments">Departments</a>
          </div>

          <div className="queue-footer-links">
            <strong>Live Queue</strong>
            <a href="#queue-tracker">Track My Queue</a>
            <a href="#queue-tracker">Token Status</a>
            <a href="#queue-tracker">Queue Progress</a>
          </div>
        </div>

        <div className="queue-footer-bottom">
          <span>© 2026 PULSELINE. All rights reserved.</span>
          <span>Live Queue · Smart Monitoring · Accessible Service</span>
        </div>
      </footer>
    </div>
  );
}

export default LiveQueue;
