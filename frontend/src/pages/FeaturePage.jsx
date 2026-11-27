import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./FeaturePage.css";

const API_URL = (process.env.REACT_APP_API_URL || "/api").replace(/\/$/, "");

function getMetricValue(metric, data, loading) {
  if (!metric.field) {
    return metric.value;
  }
  if (loading) {
    return "Loading...";
  }
  if (!data || data[metric.field] === null || data[metric.field] === undefined) {
    return metric.fallback;
  }
  return `${data[metric.field]}${metric.suffix || ""}`;
}

function FeaturePage({ feature }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(feature.endpoint));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!feature.endpoint) {
      return undefined;
    }

    let active = true;
    const loadAnalytics = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_URL}${feature.endpoint}`, {
          credentials: "include",
        });
        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(
            responseData.detail ||
              `Analytics request failed (${response.status}).`
          );
        }
        if (
          !responseData ||
          typeof responseData !== "object" ||
          Array.isArray(responseData)
        ) {
          throw new Error("The analytics service returned an invalid response.");
        }
        if (active) {
          setData(responseData);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();
    return () => {
      active = false;
    };
  }, [feature.endpoint]);

  const chartData = feature.chart && data
    ? data[feature.chart.field]
    : null;
  const maxVolume = Array.isArray(chartData)
    ? Math.max(...chartData.map((item) => item.value), 1)
    : 1;

  return (
    <main className="feature-page">
      <div className="feature-page-container">
        <Link className="feature-page-back" to="/">
          <span aria-hidden="true">←</span> Home
        </Link>

        <section className="feature-page-hero">
          <div className="feature-page-icon" aria-hidden="true">
            {feature.icon}
          </div>
          <div>
            <span className="feature-page-category">{feature.category}</span>
            <h1>{feature.title}</h1>
            <p>{feature.description}</p>
            <span className="feature-page-status">{feature.status}</span>
          </div>
        </section>

        <section className="feature-page-metrics" aria-label="Feature summary">
          {feature.metrics.map((metric) => (
            <article className="feature-page-metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{getMetricValue(metric, data, loading)}</strong>
              <p>{metric.note}</p>
            </article>
          ))}
        </section>

        {error && (
          <p className="feature-page-error" role="alert">
            Could not load live operational metrics: {error}
          </p>
        )}

        {feature.chart && (
          <section className="feature-page-panel">
            <div className="feature-page-section-heading">
              <div>
                <span>LIVE DATA</span>
                <h2>{feature.chart.title}</h2>
                <p>{feature.chart.description}</p>
              </div>
              <span className="feature-page-refresh">
                {loading ? "Updating" : error ? "Unavailable" : "Current"}
              </span>
            </div>
            {Array.isArray(chartData) && chartData.length > 0 ? (
              <div className="feature-page-volume-list">
                {chartData.map((item) => (
                  <div className="feature-page-volume-row" key={item.time}>
                    <span>{item.time}</span>
                    <div className="feature-page-volume-track">
                      <span
                        style={{
                          width: `${(item.value / maxVolume) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="feature-page-empty">
                {loading
                  ? "Loading appointment volume..."
                  : "No hourly appointment data is available."}
              </p>
            )}
          </section>
        )}

        <section className="feature-page-panel">
          <div className="feature-page-section-heading">
            <div>
              <span>FEATURE OVERVIEW</span>
              <h2>Capabilities and requirements</h2>
              <p>{feature.notice}</p>
            </div>
          </div>
          <div className="feature-page-capabilities">
            {feature.capabilities.map((capability) => (
              <article key={capability.title}>
                <span aria-hidden="true">✓</span>
                <div>
                  <h3>{capability.title}</h3>
                  <p>{capability.description}</p>
                </div>
              </article>
            ))}
          </div>
          {feature.action && (
            <Link className="feature-page-action" to={feature.action.to}>
              {feature.action.label} <span aria-hidden="true">→</span>
            </Link>
          )}
        </section>
      </div>
    </main>
  );
}

export default FeaturePage;
