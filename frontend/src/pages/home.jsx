
import React, { useEffect, useState } from "react";
import supportedLanguages from "../languages";
import "./home.css";

const API_BASE_URL = (process.env.REACT_APP_API_URL || "/api").replace(/\/$/, "");

const NAVIGATION = [
  { name: "Home", href: "#home", icon: "⌂" },
  { name: "Appointment", href: "/appointment", icon: "▣" },
  { name: "AI Assistant", href: "/ai-assistant", icon: "✧" },
  { name: "Live Queue", href: "/live-queue", icon: "◷" },
  { name: "Departments", href: "/departments", icon: "✚" }
];

const infrastructure = [
  ["🏢", "Hospital Digital Twin", "Virtual infrastructure representation.", "DEMO"],
  ["⚙️", "Predictive Maintenance", "Identify maintenance requirements.", "MODEL REQUIRED"],
  ["📡", "IoT Infrastructure Monitor", "Monitor connected hospital sensors.", "DEVICE REQUIRED"],
  ["🌡️", "Environmental Intelligence", "Monitor indoor environmental conditions.", "DEVICE REQUIRED"],
  ["⚡", "Smart Energy Analytics", "Analyze energy consumption.", "DEVICE REQUIRED"],
  ["💧", "Water Monitoring", "Monitor water usage and system status.", "DEVICE REQUIRED"],
  ["📦", "Asset Tracking Intelligence", "Track hospital infrastructure assets.", "INTEGRATION REQUIRED"],
  ["♻️", "Smart Waste Intelligence", "Analyze hospital waste management.", "DATA REQUIRED"]
];

const predictive = [
  ["01", "Hospital Capacity Prediction"],
  ["02", "Resource Demand Forecasting"],
  ["03", "Equipment Failure Prediction"],
  ["04", "Energy Consumption Prediction"],
  ["05", "Infrastructure Risk Prediction"],
  ["06", "Operational Anomaly Detection"],
  ["07", "Resource Optimization Engine"]
];

const visitors = [
  "Intelligent Visitor Preparation",
  "Visitor Guidelines",
  "Hospital Visiting Hours",
  "Admission and Discharge Information",
  "Document Preparation Checklist",
  "Multilingual Visitor Information",
  "Smart Accessibility Guidance"
];

const emergencies = [
  "Emergency Contact Information",
  "Disaster Preparedness Intelligence",
  "Evacuation Route Guidance",
  "Emergency Scenario Simulation",
  "Fire Safety Monitoring",
  "Emergency Infrastructure Readiness"
];

const awareness = [
  ["🌿", "Preventive Healthcare"],
  ["🩺", "Disease Prevention"],
  ["🏃", "Healthy Lifestyle"],
  ["☀️", "Seasonal Health Awareness"],
  ["🥗", "Nutrition Education"],
  ["📚", "Public Health Education"]
];

const rights = [
  ["⚖️", "Patient Rights & Responsibilities", "Patient rights and responsibilities information."],
  ["🔐", "Data Privacy Policy", "How personal information is protected."],
  ["📝", "Informed Consent Information", "Information about consent and authorization."],
  ["🤝", "Confidentiality Guidelines", "Hospital confidentiality standards."],
  ["🛡️", "AI Privacy Risk Monitoring", "Privacy risk identification for AI workflows.", "REVIEW REQUIRED"],
  ["⛓️", "Secure Data Integrity Verification", "Tamper-evident audit verification.", "INTEGRATION REQUIRED"]
];

const transparency = [
  ["📋", "Hospital Service Quality Indicators", "Published hospital service quality measurements."],
  ["📊", "Resource Utilization Analytics", "Resource utilization reporting."],
  ["🌱", "Energy Sustainability Analytics", "Energy efficiency and sustainability reporting."],
  ["📈", "Infrastructure Performance Trends", "Infrastructure performance history."],
  ["📑", "Hospital Transparency Reports", "Official hospital performance reports."]
];

const initialProfile = {
  name: "PULSELINE Hospital",
  address: "",
  phone: "",
  email: "",
  contactHours: "",
  introduction: "",
  history: "",
  mission: "",
  vision: "",
  totalStaff: null,
  availableBeds: null,
  infrastructureCount: null,
  emergencySupport: ""
};

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    const detail =
      data.detail ||
      Object.entries(data)
        .map(([field, messages]) =>
          `${field}: ${Array.isArray(messages) ? messages.join(" ") : messages}`
        )
        .join("; ");
    throw new Error(detail || `API request failed: ${response.status}`);
  }

  return data;
}

function SectionHeading({ number, label, title, description }) {
  return (
    <div className="section-heading">
      <div className="section-label">
        <span>{number}</span> / {label}
      </div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function FeatureCard({ icon, title, description, status }) {
  return (
    <article className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {status && <span className="status-tag">{status}</span>}
    </article>
  );
}

function InformationList({ items }) {
  return (
    <div className="information-list">
      {items.map((item, index) => (
        <div className="information-item" key={item}>
          <span className="item-number">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{item}</span>
          <span className="item-arrow">↗</span>
        </div>
      ))}
    </div>
  );
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState(initialProfile);
  const [notices, setNotices] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState("5");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [noticeText, setNoticeText] = useState("");
  const [noticeResult, setNoticeResult] = useState("");
  const [language, setLanguage] = useState("Bengali");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAllNotices, setShowAllNotices] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest("/hospital/profile/"),
      apiRequest("/notices/"),
    ])
      .then(([hospitalProfile, savedNotices]) => {
        if (!active) return;
        setProfile({ ...initialProfile, ...hospitalProfile });
        setNotices(savedNotices);
      })
      .catch((error) => {
        if (active) setNoticeResult(`Could not load hospital data: ${error.message}`);
      });

    return () => {
      active = false;
    };
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    setMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = search.trim().toLowerCase();
    if (!query) return;

    const match = [
      ["home", "home"],
      ["intelligence", "intelligence"],
      ["overview", "overview"],
      ["about", "about"],
      ["infrastructure", "infrastructure"],
      ["predictive", "predictive"],
      ["visitor", "visitor"],
      ["emergency", "emergency"],
      ["notice", "notices"],
      ["announcement", "notices"],
      ["awareness", "awareness"],
      ["rights", "rights"],
      ["privacy", "rights"],
      ["transparency", "transparency"],
      ["feedback", "feedback"],
      ["contact", "contact"]
    ].find(([keyword]) => query.includes(keyword));

    if (match) scrollTo(match[1]);
    else alert("No matching Home Page section found.");
  };

  const handleFeedback = async (e) => {
    e.preventDefault();

    if (!feedback.trim()) {
      setFeedbackMessage("Please enter your feedback.");
      return;
    }

    try {
      await apiRequest("/feedback/", {
        method: "POST",
        body: JSON.stringify({
          message: feedback.trim(),
          rating: Number(rating),
          category: "General",
        }),
      });
      setFeedback("");
      setFeedbackMessage("Thank you. Your feedback was submitted.");
    } catch (error) {
      setFeedbackMessage(`Could not submit feedback: ${error.message}`);
    }
  };

  const handleNoticeSave = async () => {
    if (!noticeText.trim()) {
      setNoticeResult("Please enter notice information first.");
      return;
    }

    try {
      const notice = await apiRequest("/notices/drafts/", {
        method: "POST",
        body: JSON.stringify({
          title: noticeText.trim().slice(0, 70),
          body: noticeText.trim(),
        }),
      });
      setNotices((previous) => [notice, ...previous]);
      setNoticeResult("Notice saved as a private draft. Staff publish official notices.");
    } catch (error) {
      setNoticeResult(`Could not save notice: ${error.message}`);
    }
  };

  const handleAI = async (type) => {
    if (!noticeText.trim()) {
      setNoticeResult("Please enter notice text first.");
      return;
    }

    setAiLoading(true);
    setNoticeResult("");

    try {
      const endpoint =
        type === "summary"
          ? "/ai/notice-summary/"
          : "/ai/translate/";

      const result = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({
          text: noticeText,
          language
        })
      });

      setNoticeResult(result.result || "No result returned.");
    } catch (error) {
      setNoticeResult(`Could not process notice: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const displayStat = (value) =>
    value === null || value === undefined || value === ""
      ? "—"
      : value;

  const displayedNotices = showAllNotices
    ? notices
    : notices.slice(0, 3);

  return (
    <div className="smartq-app">

      {/* NAVIGATION BAR */}

      <header className="navbar">
        <a href="#home" className="brand">
          <div className="brand-symbol">✚</div>
          <div>
            <h2>PULSELINE <span>AI</span></h2>
            <small>SMART HOSPITAL</small>
          </div>
        </a>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav className={menuOpen ? "nav-links active" : "nav-links"}>
          {NAVIGATION.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={item.name === "Home" ? "active-link" : ""}
              onClick={() => setMenuOpen(false)}
            >
              <span>{item.icon}</span> {item.name}
            </a>
          ))}
        </nav>

        <a href="#contact" className="nav-contact">
          Contact Us ↗
        </a>
      </header>

      <main>

        {/* 01 HERO */}

        <section className="hero" id="home">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="pulse-dot"></span>
              NEXT GENERATION SMART HOSPITAL
            </div>

            <h1>
              Welcome to <span>Smart Healthcare.</span>
            </h1>

            <p>
              Your trusted healthcare destination for smarter,
              safer and better hospital services.
            </p>

            <form className="hospital-search" onSubmit={handleSearch}>
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hospital information..."
                aria-label="Search hospital information"
              />
              <button type="submit">Search →</button>
            </form>

            <div className="hero-points">
              <span>✓ Patient First</span>
              <span>✓ Smart Infrastructure</span>
              <span>✓ 24/7 Emergency Support</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-orbit orbit-one"></div>
            <div className="hero-orbit orbit-two"></div>

            <div className="hospital-art">
              <div className="hospital-cross">✚</div>
              <div className="hospital-building">
                <div className="building-label">PULSELINE</div>
                <div className="building-windows">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i}></span>
                  ))}
                </div>
                <div className="building-door"></div>
              </div>
            </div>

            <div className="floating-card floating-one">
              <span>✚</span>
              <div>
                <b>Smart Hospital</b>
                <small>Digital Infrastructure</small>
              </div>
            </div>

            <div className="floating-card floating-two">
              <span>◈</span>
              <div>
                <b>AI Intelligence</b>
                <small>Technology Platform</small>
              </div>
            </div>
          </div>
        </section>

        {/* 02 AI HOSPITAL INTELLIGENCE */}

        <section className="section" id="intelligence">
          <SectionHeading
            number="02"
            label="HOSPITAL INTELLIGENCE"
            title="AI Hospital Intelligence Dashboard"
            description="A centralized intelligence layer for hospital operational awareness."
          />

          <div className="feature-grid four-columns">
            <FeatureCard icon="🧠" title="AI Intelligence Engine"
              description="Centralized hospital intelligence and information processing."
              status="PLATFORM" />
            <FeatureCard icon="📈" title="Predictive Analytics"
              description="Analyze historical operational data to identify trends."
              status="MODEL REQUIRED" />
            <FeatureCard icon="📊" title="Operational Insights"
              description="Understand hospital operational performance indicators."
              status="DATA REQUIRED" />
            <FeatureCard icon="🛡️" title="Hospital Risk Monitor"
              description="Identify infrastructure and operational risk indicators."
              status="DATA REQUIRED" />
          </div>
        </section>

        {/* 03 HOSPITAL OVERVIEW */}

        <section className="section overview-section" id="overview">
          <SectionHeading
            number="03"
            label="HOSPITAL OVERVIEW"
            title="Hospital at a Glance"
            description="Verified hospital statistics will appear here after connecting hospital data."
          />

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👨‍⚕️</div>
              <h2>{displayStat(profile.totalStaff)}</h2>
              <p>Total Hospital Staff</p>
              <small>Verified data required</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🛏️</div>
              <h2>{displayStat(profile.availableBeds)}</h2>
              <p>Available Beds</p>
              <small>Verified data required</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏥</div>
              <h2>{displayStat(profile.infrastructureCount)}</h2>
              <p>Hospital Infrastructure</p>
              <small>Verified data required</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🚑</div>
              <h2>{displayStat(profile.emergencySupport)}</h2>
              <p>Emergency Support</p>
              <small>Verified data required</small>
            </div>
          </div>
        </section>

        {/* 04 ABOUT HOSPITAL */}

        <section className="section" id="about">
          <SectionHeading
            number="04"
            label="ABOUT OUR HOSPITAL"
            title="About PULSELINE Hospital"
            description="Discover our hospital identity, values, history and commitment to quality."
          />

          <div className="about-layout">
            <div className="about-main">
              <div className="about-symbol">✚</div>
              <span className="eyebrow-text">OUR HOSPITAL</span>
              <h3>{profile.name}</h3>
              <p>
                {profile.introduction ||
                  "A digital hospital management platform focused on intelligent infrastructure, visitor information, operational intelligence and digital transparency."}
              </p>
              <span className="status-tag">HOSPITAL PROFILE</span>
            </div>

            <div className="about-list">
              {[
                ["01", "Hospital Introduction", profile.introduction || "Hospital introduction will be published here."],
                ["02", "Mission & Vision", profile.mission || "Official mission and vision information."],
                ["03", "Hospital History", profile.history || "Hospital history and institutional journey."],
                ["04", "Management Information", "Official hospital administration details."],
                ["05", "Quality & Safety Standards", "Verified hospital quality and safety information."]
              ].map(([number, title, description]) => (
                <div className="about-row" key={number}>
                  <span>{number}</span>
                  <div>
                    <h4>{title}</h4>
                    <p>{description}</p>
                  </div>
                  <b>↗</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 05 SMART INFRASTRUCTURE */}

        <section className="section dark-section" id="infrastructure">
          <SectionHeading
            number="05"
            label="SMART INFRASTRUCTURE"
            title="Intelligent Hospital Infrastructure"
            description="A connected ecosystem for infrastructure visibility and management."
          />

          <div className="feature-grid">
            {infrastructure.map(([icon, title, description, status]) => (
              <FeatureCard
                key={title}
                icon={icon}
                title={title}
                description={description}
                status={status}
              />
            ))}
          </div>
        </section>

        {/* 06 PREDICTIVE INTELLIGENCE */}

        <section className="section" id="predictive">
          <SectionHeading
            number="06"
            label="PREDICTIVE INTELLIGENCE"
            title="AI Predictive Analytics Centre"
            description="Machine learning based forecasting and operational intelligence."
          />

          <div className="prediction-layout">
            <div className="prediction-intro">
              <div className="prediction-icon">◈</div>
              <h3>Predictive Intelligence Engine</h3>
              <p>
                Analyze historical hospital data to identify
                patterns and forecast operational requirements.
              </p>
              <span className="status-tag">TRAINED ML MODEL REQUIRED</span>
            </div>

            <div className="prediction-list">
              {predictive.map(([number, title]) => (
                <div className="prediction-row" key={number}>
                  <span>{number}</span>
                  <b>{title}</b>
                  <small>NOT CONNECTED</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 07 VISITOR INFORMATION */}

        <section className="section visitor-section" id="visitor">
          <SectionHeading
            number="07"
            label="VISITOR INFORMATION"
            title="Smart Visitor Information Centre"
            description="Information visitors need to prepare for their hospital visit."
          />

          <InformationList items={visitors} />
        </section>

        {/* 08 EMERGENCY PREPAREDNESS */}

        <section className="section emergency-section" id="emergency">
          <SectionHeading
            number="08"
            label="EMERGENCY PREPAREDNESS"
            title="Smart Emergency Preparedness Centre"
            description="Hospital-approved emergency preparedness and infrastructure information."
          />

          <div className="emergency-banner">
            <div>
              <span className="emergency-label">EMERGENCY INFORMATION</span>
              <h3>Preparedness starts with awareness.</h3>
              <p>
                Official emergency contacts and safety information
                must be verified by hospital management.
              </p>
            </div>
            <div className="emergency-symbol">🚨</div>
          </div>

          <InformationList items={emergencies} />
        </section>

        {/* 09 HOSPITAL ANNOUNCEMENTS */}

        <section className="section" id="notices">
          <SectionHeading
            number="09"
            label="HOSPITAL ANNOUNCEMENTS"
            title="AI-Powered Notice Intelligence"
            description="Notice organization, summarization and multilingual communication."
          />

          <div className="notice-layout">
            <div className="notice-info">
              <div className="notice-icon">📢</div>
              <h3>Notice Intelligence Centre</h3>
              <p>
                Enter official hospital notice information
                for summarization and translation.
              </p>
              <span className="status-tag">GEMINI API REQUIRED</span>
            </div>

            <div className="notice-tool">
              <label>Hospital Notice Text</label>
              <textarea
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                placeholder="Paste official hospital notice here..."
              />

              <label>Translation Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {supportedLanguages.map(({ name }) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <div className="notice-actions">
                <button
                  className="primary-button"
                  disabled={aiLoading}
                  onClick={() => handleAI("summary")}
                >
                  {aiLoading ? "Processing..." : "✧ AI Summarize"}
                </button>

                <button
                  className="secondary-button"
                  disabled={aiLoading}
                  onClick={() => handleAI("translate")}
                >
                  Translate
                </button>

                <button className="outline-button" onClick={handleNoticeSave}>
                  Save Notice
                </button>
              </div>

              {noticeResult && (
                <div className="result-box">{noticeResult}</div>
              )}
            </div>
          </div>

          <div className="notice-feature-grid">
            <FeatureCard icon="📄" title="Official Hospital Notices"
              description="Centralized official notice information." />
            <FeatureCard icon="🧠" title="Automatic Notice Classification"
              description="Organize notices by category using AI." />
            <FeatureCard icon="🌐" title="Multilingual Notice Translation"
              description="Make official notices accessible in multiple languages." />
            <FeatureCard icon="📣" title="Public Announcements"
              description="Display important public information." />
          </div>

          <div className="saved-notices">
            <div className="saved-heading">
              <h3>Saved Notice Records</h3>
              <span>{notices.length} saved</span>
            </div>

            {notices.length === 0 ? (
              <p className="empty-state">No saved notices yet.</p>
            ) : (
              <>
                {displayedNotices.map((item) => (
                  <div className="saved-notice" key={item.id}>
                    <div>
                      <b>{item.title}</b>
                      <p>{item.body}</p>
                      <small>{new Date(item.date).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
                {notices.length > 3 && (
                  <button
                    className="text-button"
                    onClick={() => setShowAllNotices(!showAllNotices)}
                  >
                    {showAllNotices ? "Show less" : "View all notices"}
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* 10 HEALTHCARE AWARENESS */}

        <section className="section awareness-section" id="awareness">
          <SectionHeading
            number="10"
            label="HEALTHCARE AWARENESS"
            title="AI Healthcare Awareness Centre"
            description="Educational healthcare information from verified public health sources."
          />

          <div className="awareness-grid">
            {awareness.map(([icon, title]) => (
              <div className="awareness-card" key={title}>
                <span>{icon}</span>
                <h3>{title}</h3>
                <p>Verified healthcare awareness and educational resources.</p>
              </div>
            ))}
          </div>

          <p className="disclaimer">
            Educational information only. This platform does not
            provide medical diagnoses or replace professional medical advice.
          </p>
        </section>

        {/* 11 PATIENT RIGHTS AND PRIVACY */}

        <section className="section" id="rights">
          <SectionHeading
            number="11"
            label="PATIENT RIGHTS & PRIVACY"
            title="Patient Rights and Data Protection"
            description="Transparent information about privacy, consent and patient responsibilities."
          />

          <div className="feature-grid three-columns">
            {rights.map(([icon, title, description, status]) => (
              <FeatureCard
                key={title}
                icon={icon}
                title={title}
                description={description}
                status={status}
              />
            ))}
          </div>
        </section>

        {/* 12 HOSPITAL TRANSPARENCY */}

        <section className="section transparency-section" id="transparency">
          <SectionHeading
            number="12"
            label="SMART HOSPITAL TRANSPARENCY"
            title="Hospital Performance & Sustainability"
            description="A transparent view of hospital service and sustainability indicators."
          />

          <div className="feature-grid three-columns">
            {transparency.map(([icon, title, description]) => (
              <FeatureCard
                key={title}
                icon={icon}
                title={title}
                description={description}
              />
            ))}
          </div>
        </section>

        {/* 13 FEEDBACK INTELLIGENCE */}

        <section className="section" id="feedback">
          <SectionHeading
            number="13"
            label="FEEDBACK INTELLIGENCE"
            title="AI Hospital Feedback Intelligence"
            description="Collect service feedback and identify recurring improvement opportunities."
          />

          <div className="feedback-layout">
            <div className="feedback-form-card">
              <h3>Share Your Hospital Experience</h3>
              <p>Your feedback helps improve hospital services.</p>

              <form onSubmit={handleFeedback}>
                <label>Experience Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  <option value="5">★★★★★ Excellent</option>
                  <option value="4">★★★★ Good</option>
                  <option value="3">★★★ Average</option>
                  <option value="2">★★ Poor</option>
                  <option value="1">★ Very Poor</option>
                </select>

                <label>Your Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write your experience..."
                />

                <button className="primary-button" type="submit">
                  Submit Feedback →
                </button>
              </form>

              {feedbackMessage && (
                <div className="result-box">{feedbackMessage}</div>
              )}
            </div>

            <div className="feedback-analysis">
              <h3>AI Feedback Analysis Engine</h3>
              <p>
                AI analysis requires a connected backend and Gemini API.
              </p>

              {[
                "AI Sentiment Analysis",
                "Complaint Theme Detection",
                "Duplicate Feedback Detection",
                "Recurring Problem Identification",
                "AI Improvement Insights"
              ].map((item, i) => (
                <div className="analysis-row" key={item}>
                  <span>{["◉", "⌕", "⧉", "↻", "✧"][i]}</span>
                  {item}
                  <small>API REQUIRED</small>
                </div>
              ))}

              <p className="feedback-count">
                Submitted feedback is delivered to the hospital team for review.
              </p>
            </div>
          </div>
        </section>

        {/* 14 HOSPITAL LOCATION AND CONTACT */}

        <section className="section contact-section" id="contact">
          <SectionHeading
            number="14"
            label="HOSPITAL LOCATION & CONTACT"
            title="Find Our Hospital"
            description="Hospital address and official communication information."
          />

          <div className="contact-grid">
            <div className="contact-card">
              <span>📍</span>
              <h3>Hospital Address</h3>
              <p>{profile.address || "Official address not added yet."}</p>
            </div>

            <div className="contact-card">
              <span>📞</span>
              <h3>Official Phone Number</h3>
              <p>{profile.phone || "Official phone number not added yet."}</p>
            </div>

            <div className="contact-card">
              <span>✉️</span>
              <h3>Email Address</h3>
              <p>{profile.email || "Official email not added yet."}</p>
            </div>

            <div className="contact-card">
              <span>🕒</span>
              <h3>Contact Hours</h3>
              <p>{profile.contactHours || "Contact hours not added yet."}</p>
            </div>
          </div>

          <div className="map-placeholder">
            <div className="map-content">
              <span>📍</span>
              <h3>Google Maps Location</h3>
              <p>Add the verified hospital address to enable directions.</p>
              <a
                href={
                  profile.address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`
                    : "https://www.google.com/maps"
                }
                target="_blank"
                rel="noreferrer"
              >
                Open Google Maps ↗
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* 15 FOOTER */}

      <footer className="footer" id="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a href="#home" className="brand">
              <div className="brand-symbol">✚</div>
              <div>
                <h2>PULSELINE <span>AI</span></h2>
                <small>SMART HOSPITAL</small>
              </div>
            </a>

            <p>
              Smart Hospital Management System powered by
              intelligent digital infrastructure.
            </p>
          </div>

          <div className="footer-links">
            <h4>QUICK LINKS</h4>
            <a href="#home">Home</a>
            <a href="/appointment">Appointment</a>
            <a href="/ai-assistant">AI Assistant</a>
            <a href="/live-queue">Live Queue</a>
            <a href="/departments">Departments</a>
          </div>

          <div className="footer-links">
            <h4>INFORMATION</h4>
            <a href="#about">About Hospital</a>
            <a href="#rights">Privacy Policy</a>
            <a href="#rights">Terms & Conditions</a>
            <a href="#contact">Contact</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} PULSELINE. All rights reserved.</p>
          <span>SMARTER INFRASTRUCTURE. BETTER HEALTHCARE.</span>
        </div>
      </footer>

      <button
        className="back-top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        ↑
      </button>
    </div>
  );
}

export default Home;
