
import React, { useEffect, useMemo, useState } from "react";
import "./depertment.css";

const API_BASE_URL = (process.env.REACT_APP_API_URL || "/api").replace(/\/$/, "");

const initialDepartments = [
  {
    id: 1,
    name: "Cardiology",
    category: "Medicine",
    icon: "❤️",
    tagline: "Heart & Blood Vessels",
    description:
      "Heart and cardiovascular care, ECG, echocardiography and cardiac services.",
    services: ["ECG", "Echocardiography", "Cardiac consultation"],
    facilities: ["ECG unit", "Cardiac diagnostic equipment"],
    floor: "Illustrative location: Ground Floor",
    hours: "Verify with hospital",
    contact: "Verify department contact",
    color: "coral",
  },
  {
    id: 2,
    name: "Neurology",
    category: "Medicine",
    icon: "🧠",
    tagline: "Brain & Nervous System",
    description:
      "Medical services relating to the brain, spinal cord and nervous system.",
    services: ["Neurological assessment", "Nerve studies"],
    facilities: ["Neurology examination unit"],
    floor: "Illustrative location: First Floor",
    hours: "Verify with hospital",
    contact: "Verify department contact",
    color: "purple",
  },
  {
    id: 3,
    name: "Orthopaedics",
    category: "Surgery",
    icon: "🦴",
    tagline: "Bones & Joints",
    description:
      "Bone, joint, muscle and mobility-related medical services.",
    services: ["Bone and joint assessment", "Fracture care"],
    facilities: ["Orthopaedic examination unit"],
    floor: "Illustrative location: First Floor",
    hours: "Verify with hospital",
    contact: "Verify department contact",
    color: "blue",
  },
  {
    id: 4,
    name: "Paediatrics",
    category: "Medicine",
    icon: "👶",
    tagline: "Child Healthcare",
    description:
      "Medical care for infants, children and adolescents.",
    services: ["Child health assessment", "Growth monitoring"],
    facilities: ["Paediatric examination unit"],
    floor: "Illustrative location: Second Floor",
    hours: "Verify with hospital",
    contact: "Verify department contact",
    color: "orange",
  },
  {
    id: 5,
    name: "Dermatology",
    category: "Medicine",
    icon: "🧴",
    tagline: "Skin & Hair",
    description:
      "Medical services relating to skin, hair and nails.",
    services: ["Skin assessment", "Dermatological consultation"],
    facilities: ["Dermatology examination unit"],
    floor: "Illustrative location: Second Floor",
    hours: "Verify with hospital",
    contact: "Verify department contact",
    color: "pink",
  },
  {
    id: 6,
    name: "Gynaecology",
    category: "Medicine",
    icon: "🌸",
    tagline: "Women's Healthcare",
    description:
      "Women's reproductive and related healthcare services.",
    services: ["Women's health consultation", "Reproductive health care"],
    facilities: ["Gynaecology examination unit"],
    floor: "Illustrative location: Second Floor",
    hours: "Verify with hospital",
    contact: "Verify department contact",
    color: "rose",
  },
  {
    id: 7,
    name: "Ophthalmology",
    category: "Medicine",
    icon: "👁️",
    tagline: "Eye Care",
    description:
      "Eye examinations and vision-related healthcare services.",
    services: ["Eye examination", "Vision assessment"],
    facilities: ["Eye examination equipment"],
    floor: "Illustrative location: Ground Floor",
    hours: "Verify with hospital",
    contact: "Verify department contact",
    color: "cyan",
  },
  {
    id: 8,
    name: "Radiology",
    category: "Diagnostics",
    icon: "🩻",
    tagline: "Medical Imaging",
    description:
      "Diagnostic imaging services such as X-ray, CT and MRI, where available.",
    services: ["X-ray", "CT", "MRI"],
    facilities: ["Imaging equipment — availability to be verified"],
    floor: "Illustrative location: Ground Floor",
    hours: "Verify with hospital",
    contact: "Verify department contact",
    color: "indigo",
  },
];

const initialFacilities = [
  {
    icon: "🧪",
    name: "Diagnostic Laboratory",
    description: "Laboratory testing and diagnostic support.",
    status: "Verify availability",
  },
  {
    icon: "🩻",
    name: "Imaging Facilities",
    description: "Imaging and scanning infrastructure.",
    status: "Verify availability",
  },
  {
    icon: "🏥",
    name: "Operation Theatre",
    description: "Surgical infrastructure and equipment.",
    status: "Verify availability",
  },
  {
    icon: "🫁",
    name: "Intensive Care",
    description: "Critical-care infrastructure.",
    status: "Verify availability",
  },
  {
    icon: "🦿",
    name: "Rehabilitation",
    description: "Physical rehabilitation facilities.",
    status: "Verify availability",
  },
  {
    icon: "⚕️",
    name: "Specialized Equipment",
    description: "Department-specific medical equipment.",
    status: "Verify availability",
  },
];

const careRelationships = [
  {
    from: "Cardiology",
    to: "Radiology",
    reason: "Diagnostic imaging coordination",
  },
  {
    from: "Neurology",
    to: "Radiology",
    reason: "Neurological imaging coordination",
  },
  {
    from: "Orthopaedics",
    to: "Radiology",
    reason: "Bone and joint imaging coordination",
  },
  {
    from: "Paediatrics",
    to: "Diagnostics",
    reason: "Age-appropriate diagnostic coordination",
  },
];

const knowledgeItems = [
  {
    title: "Understanding ECG",
    category: "Diagnostic Guide",
    description:
      "An introductory explanation of electrocardiography and its purpose.",
  },
  {
    title: "Preparing for an X-ray",
    category: "Preparation Guide",
    description:
      "General information about what patients may need to know before imaging.",
  },
  {
    title: "Understanding MRI",
    category: "Procedure Guide",
    description:
      "An overview of MRI imaging and common preparation considerations.",
  },
  {
    title: "Understanding specialist departments",
    category: "Patient Education",
    description:
      "Learn how different medical specialties provide different services.",
  },
];

const feedbackCategories = [
  "Communication",
  "Facility cleanliness",
  "Staff assistance",
  "Information clarity",
  "Accessibility",
];

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
    throw new Error(
      data.detail ||
        Object.entries(data)
          .map(([field, messages]) =>
            `${field}: ${Array.isArray(messages) ? messages.join(" ") : messages}`
          )
          .join("; ") ||
        `Request failed (${response.status}).`
    );
  }

  return data;
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="dept-section-heading">
      <span className="dept-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function Departments() {
  const [departments, setDepartments] = useState(initialDepartments);
  const [specialists, setSpecialists] = useState([]);
  const [facilities, setFacilities] = useState(initialFacilities);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [discoveryText, setDiscoveryText] = useState("");
  const [discoveryResult, setDiscoveryResult] = useState("");
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [language, setLanguage] = useState("English");
  const [expandedFacility, setExpandedFacility] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("Communication");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest("/departments/"),
      apiRequest("/specialists/"),
      apiRequest("/facilities/"),
    ])
      .then(([departmentData, specialistData, facilityData]) => {
        if (!active) return;
        setDepartments(departmentData);
        setSpecialists(specialistData);
        setFacilities(facilityData);
      })
      .catch((error) => {
        if (!active) return;
        setDepartments([]);
        setSpecialists([]);
        setFacilities([]);
        setDataError(`Could not load hospital directory: ${error.message}`);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) => {
      const matchesSearch = [
        department.name,
        department.tagline,
        department.description,
        ...department.services,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || department.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [departments, search, category]);

  const discoverDepartment = async () => {
    if (!discoveryText.trim()) {
      setDiscoveryResult("Please describe the type of healthcare service you are looking for.");
      return;
    }

    setDiscoveryLoading(true);
    setDiscoveryResult("");
    try {
      const result = await apiRequest("/departments/discover/", {
        method: "POST",
        body: JSON.stringify({ text: discoveryText.trim(), language }),
      });
      setDiscoveryResult(result.result);
    } catch (error) {
      setDiscoveryResult(`Department discovery is unavailable: ${error.message}`);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const openDepartment = (department) => {
    setSelectedDepartment(department);
  };

  const closeDepartment = () => {
    setSelectedDepartment(null);
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    setFeedbackSubmitting(true);
    setFeedbackMessage("");
    try {
      await apiRequest("/feedback/", {
        method: "POST",
        body: JSON.stringify({
          category: feedbackCategory,
          rating: feedbackRating,
          department: selectedDepartment?.name || "",
        }),
      });
      setFeedbackMessage("Thank you. Your department feedback was submitted.");
    } catch (error) {
      setFeedbackMessage(`Could not submit feedback: ${error.message}`);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div className="departments-page">
      {/* NAVIGATION */}
      <nav className="dept-navbar">
        <a href="/" className="dept-brand">
          <span className="dept-brand-icon">✚</span>
          <span>PULSELINE <strong>AI</strong></span>
        </a>

        <div className="dept-nav-links">
          <a href="/">Home</a>
          <a href="/appointment">Appointment</a>
          <a href="/ai-assistant">AI Assistant</a>
          <a href="/live-queue">Live Queue</a>
          <a href="/departments" className="active">Departments</a>
        </div>

        <span className="dept-nav-status">
          <span className="dept-status-dot" />
          Department Directory
        </span>
      </nav>

      {/* 01 HERO */}
      <header className="dept-hero">
        <div className="dept-hero-content">
          <span className="dept-hero-label">
            HOSPITAL DEPARTMENT DIRECTORY
          </span>

          <h1>
            Explore Hospital
            <span> Departments</span>
          </h1>

          <p>
            Find the right medical department, explore its facilities,
            and understand the healthcare services available at our hospital.
          </p>

          <div className="dept-hero-actions">
            <a href="#department-directory" className="dept-primary-btn">
              Explore Departments <span>→</span>
            </a>
            <a href="#ai-discovery" className="dept-secondary-btn">
              AI Department Discovery
            </a>
          </div>

          <div className="dept-hero-points">
            <span>✓ Department Directory</span>
            <span>✓ AI-Powered Discovery</span>
            <span>✓ Medical Service Information</span>
          </div>
        </div>

        <div className="dept-hero-visual">
          <div className="dept-hero-card">
            <div className="dept-hero-card-top">
              <span>MEDICAL SPECIALTIES</span>
              <span className="dept-hero-card-icon">✚</span>
            </div>

            <div className="dept-hero-specialties">
              <div><span>❤️</span><strong>Cardiology</strong></div>
              <div><span>🧠</span><strong>Neurology</strong></div>
              <div><span>🦴</span><strong>Orthopaedics</strong></div>
              <div><span>👁️</span><strong>Ophthalmology</strong></div>
            </div>

            <div className="dept-hero-card-bottom">
              <span>Specialty information</span>
              <strong>Explore directory →</strong>
            </div>
          </div>
          <div className="dept-floating-badge">
            <span>08</span>
            <small>Illustrative departments</small>
          </div>
        </div>
      </header>

      {/* 02 AI DISCOVERY */}
      <section className="dept-section dept-discovery-section" id="ai-discovery">
        <SectionHeading
          eyebrow="02 — AI DEPARTMENT DISCOVERY"
          title="Find the Right Specialty"
          description="Describe the type of healthcare service you are looking for. This demo provides general department guidance, not a medical diagnosis."
        />

        <div className="dept-discovery-box">
          <div className="dept-discovery-left">
            <span className="dept-ai-label">PULSELINE SPECIALTY DISCOVERY</span>
            <h3>What kind of medical service do you need?</h3>
            <p>
              Describe your healthcare information need in simple language.
              The system can suggest a relevant department using verified
              hospital specialty information.
            </p>

            <textarea
              value={discoveryText}
              onChange={(event) => setDiscoveryText(event.target.value)}
              placeholder="Example: I want information about heart and cardiovascular services..."
              rows={4}
            />

            <div className="dept-discovery-controls">
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                aria-label="Select language"
              >
                <option>English</option>
                <option>Bengali</option>
                <option>Hindi</option>
                <option>Odia</option>
                <option>Tamil</option>
                <option>Telugu</option>
              </select>

              <button
                type="button"
                onClick={discoverDepartment}
                disabled={discoveryLoading}
              >
                {discoveryLoading ? "Finding..." : "Discover Department →"}
              </button>
            </div>

            {discoveryResult && (
              <div className="dept-discovery-result" aria-live="polite">
                <strong>Discovery result</strong>
                <p>{discoveryResult}</p>
                <small>Selected language: {language}</small>
              </div>
            )}
          </div>

          <div className="dept-discovery-right">
            <div className="dept-ai-orbit">✦</div>
            <h3>AI Specialty Matching</h3>
            <p>Department guidance based on the information you provide.</p>
            <ul>
              <li>Natural-language specialty discovery</li>
              <li>Related department recommendations</li>
              <li>Multilingual department descriptions</li>
              <li>Explainable specialty matching</li>
              <li>Verified hospital knowledge integration</li>
            </ul>
            <div className="dept-safety-note">
              <strong>Safety limitation</strong>
              <span>
                Not for diagnosis, treatment decisions or emergency assessment.
                For urgent symptoms, seek emergency medical care.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 03 DEPARTMENT DIRECTORY */}
      <section
        className="dept-section dept-directory-section"
        id="department-directory"
      >
        <SectionHeading
          eyebrow="03 — DEPARTMENT DIRECTORY"
          title="Browse Medical Departments"
          description="Explore medical specialties and the services associated with each department. Listed departments are illustrative until confirmed by the hospital."
        />
        {dataError && <p role="alert">{dataError}</p>}

        <div className="dept-directory-tools">
          <div className="dept-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search cardiology, neurology, orthopaedics..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="dept-category-filters">
            {["All", "Medicine", "Surgery", "Diagnostics"].map((item) => (
              <button
                key={item}
                type="button"
                className={category === item ? "selected" : ""}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
            {specialists.length === 0 && (
              <p>No verified specialist profiles have been published.</p>
            )}
          </div>
        </div>

        <div className="dept-directory-grid">
          {filteredDepartments.map((department) => (
            <article className="dept-card" key={department.id}>
              <div className={`dept-card-icon ${department.color}`}>
                {department.icon}
              </div>
              <div className="dept-card-category">{department.category}</div>
              <h3>{department.name}</h3>
              <span className="dept-card-tagline">{department.tagline}</span>
              <p>{department.description}</p>

              <div className="dept-card-services">
                {department.services.slice(0, 2).map((service) => (
                  <span key={service}>{service}</span>
                ))}
              </div>

              <button
                type="button"
                className="dept-card-link"
                onClick={() => openDepartment(department)}
              >
                View Department Profile <span>→</span>
              </button>
            </article>
          ))}
        </div>

        {filteredDepartments.length === 0 && (
          <div className="dept-empty">
            <span>⌕</span>
            <h3>No departments found</h3>
            <p>Try another department name or category.</p>
          </div>
        )}
      </section>

      {/* 04 DEPARTMENT PROFILE */}
      <section className="dept-section dept-profile-section">
        <SectionHeading
          eyebrow="04 — DEPARTMENT PROFILE"
          title="Department Information"
          description="Each department profile provides service descriptions, facilities, preparation information and official contact details."
        />

        <div className="dept-profile-preview">
          <div className="dept-profile-preview-icon">🏥</div>
          <div>
            <h3>Explore Individual Department Profiles</h3>
            <p>
              Select any department card above to view its service list,
              diagnostic facilities, location information and department
              contact details.
            </p>
          </div>
          <a href="#department-directory">Browse directory →</a>
        </div>

        <div className="dept-profile-features">
          {[
            ["01", "Department Overview", "Introduction and specialty scope"],
            ["02", "Medical Services", "Treatments and service descriptions"],
            ["03", "Diagnostic Facilities", "Department-related diagnostic support"],
            ["04", "Equipment & Infrastructure", "Verified department equipment"],
            ["05", "Patient Preparation", "Department-specific preparation guides"],
            ["06", "Operating Information", "Verified hours and contact details"],
          ].map(([number, title, description]) => (
            <div className="dept-profile-feature" key={number}>
              <span>{number}</span>
              <div>
                <h4>{title}</h4>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 05 SPECIALIST DIRECTORY */}
      <section className="dept-section dept-specialist-section">
        <SectionHeading
          eyebrow="05 — SPECIALIST & MEDICAL TEAM DIRECTORY"
          title="Meet the Medical Teams"
          description="Specialist profiles should be populated only from verified hospital staff records."
        />

        <div className="dept-specialist-grid">
          {specialists.map((specialist) => (
            <article className="dept-specialist-card" key={specialist.name}>
              <div className="dept-specialist-avatar">👨‍⚕️</div>
              <span className="dept-profile-pending">Profile pending verification</span>
              <h3>{specialist.name}</h3>
              <p className="dept-specialist-department">{specialist.department}</p>
              <div className="dept-specialist-details">
                <p><strong>Qualification:</strong> {specialist.qualification}</p>
                <p><strong>Experience:</strong> {specialist.experience}</p>
                <p><strong>Languages:</strong> {specialist.languages}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="dept-data-warning">
          No doctor names, qualifications, experience or credentials are
          represented as verified in this demo.
        </p>
      </section>

      {/* 06 FACILITY EXPLORER */}
      <section className="dept-section dept-facility-section">
        <SectionHeading
          eyebrow="06 — MEDICAL FACILITY EXPLORER"
          title="Explore Medical Infrastructure"
          description="Discover the types of medical facilities associated with hospital departments."
        />

        <div className="dept-facility-grid">
          {facilities.map((facility) => (
            <article className="dept-facility-card" key={facility.name}>
              <div className="dept-facility-icon">{facility.icon}</div>
              <h3>{facility.name}</h3>
              <p>{facility.description}</p>
              <span className="dept-availability-label">
                {facility.isVerified ? facility.status : "Availability not verified"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setExpandedFacility(
                    expandedFacility === facility.name ? "" : facility.name
                  )
                }
              >
                {expandedFacility === facility.name
                  ? "Hide details"
                  : "Explore facility"}
              </button>
              {expandedFacility === facility.name && (
                <div className="dept-facility-expanded">
                  <strong>{facility.isVerified ? "Facility information" : "Unverified facility information"}</strong>
                  <p>
                    {facility.details ||
                      "Staff can add verified equipment, supported departments, location and availability through Django Admin."}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* 07 CAPABILITY INTELLIGENCE */}
      <section className="dept-section dept-capability-section">
        <SectionHeading
          eyebrow="07 — DEPARTMENT CAPABILITY INTELLIGENCE"
          title="Understand Department Capabilities"
          description="A structured view of which services and diagnostic resources are supported by each department."
        />

        <div className="dept-capability-layout">
          <div className="dept-capability-intro">
            <span className="dept-capability-symbol">⌘</span>
            <h3>Service Capability Mapping</h3>
            <p>
              Connect department services with the diagnostic facilities,
              specialist coverage and infrastructure required to deliver them.
            </p>
            <ul>
              <li>Department service capability mapping</li>
              <li>Available and unavailable service records</li>
              <li>Required diagnostic facility mapping</li>
              <li>Specialty coverage analysis</li>
              <li>Facility compatibility information</li>
            </ul>
          </div>

          <div className="dept-capability-matrix">
            <div className="dept-matrix-heading">
              <strong>Capability data structure</strong>
              <span>Illustrative — not live hospital data</span>
            </div>
            {[
              ["Department", "Service", "Facility"],
              ["Cardiology", "Cardiac assessment", "ECG unit"],
              ["Neurology", "Nerve assessment", "Neurology unit"],
              ["Orthopaedics", "Bone assessment", "Imaging unit"],
              ["Radiology", "Diagnostic imaging", "Imaging equipment"],
            ].map((row, index) => (
              <div className="dept-matrix-row" key={index}>
                {row.map((cell, cellIndex) => (
                  <span
                    className={index === 0 ? "matrix-header" : ""}
                    key={cellIndex}
                  >
                    {cell}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 08 CROSS DEPARTMENT NETWORK */}
      <section className="dept-section dept-network-section">
        <SectionHeading
          eyebrow="08 — CROSS-DEPARTMENT CARE NETWORK"
          title="Connected Specialty Network"
          description="Understand how different departments may coordinate when a patient's care requires more than one specialty."
        />

        <div className="dept-network-grid">
          {careRelationships.map((relationship, index) => (
            <article className="dept-network-card" key={index}>
              <div className="dept-network-nodes">
                <span>{relationship.from}</span>
                <span className="dept-network-arrow">↔</span>
                <span>{relationship.to}</span>
              </div>
              <p>{relationship.reason}</p>
            </article>
          ))}
        </div>

        <div className="dept-network-note">
          <strong>Referral pathway information</strong>
          <p>
            Actual referral rules and collaborative care pathways must be
            approved and maintained by the hospital's clinical administration.
          </p>
        </div>
      </section>

      {/* 09 KNOWLEDGE CENTRE */}
      <section className="dept-section dept-knowledge-section">
        <SectionHeading
          eyebrow="09 — DEPARTMENT KNOWLEDGE CENTRE"
          title="Medical Knowledge & Education"
          description="Explore verified educational material explaining department services, medical procedures and diagnostic preparation."
        />

        <div className="dept-knowledge-grid">
          {knowledgeItems.map((item, index) => (
            <article className="dept-knowledge-card" key={index}>
              <span className="dept-knowledge-number">
                RESOURCE 0{index + 1}
              </span>
              <span className="dept-knowledge-category">{item.category}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="dept-resource-status">
                Hospital resource integration pending
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* 10 FEEDBACK AND QUALITY */}
      <section className="dept-section dept-feedback-section">
        <SectionHeading
          eyebrow="10 — DEPARTMENT FEEDBACK & QUALITY"
          title="Department Service Experience"
          description="A privacy-protected overview of department-level service feedback and improvement categories."
        />

        <div className="dept-feedback-layout">
          <div className="dept-feedback-info">
            <span className="dept-feedback-icon">✦</span>
            <h3>Patient Experience Intelligence</h3>
            <p>
              The production system can summarize aggregated feedback and
              identify improvement themes without exposing individual patient
              medical information.
            </p>
            <div className="dept-feedback-categories">
              {feedbackCategories.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <small>
              Department ratings and quality indicators will appear only when
              verified, privacy-reviewed data is connected.
            </small>
          </div>

          <form className="dept-feedback-form" onSubmit={submitFeedback}>
            <h3>Demo Experience Feedback</h3>
            <label htmlFor="feedback-category">Feedback category</label>
            <select
              id="feedback-category"
              value={feedbackCategory}
              onChange={(event) => setFeedbackCategory(event.target.value)}
            >
              {feedbackCategories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <label htmlFor="feedback-rating">Your rating</label>
            <select
              id="feedback-rating"
              value={feedbackRating}
              onChange={(event) =>
                setFeedbackRating(Number(event.target.value))
              }
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option value={rating} key={rating}>
                  {rating} / 5
                </option>
              ))}
            </select>

            <button type="submit" disabled={feedbackSubmitting}>
              {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
            {feedbackMessage && <small role="status">{feedbackMessage}</small>}
            <small>
              Feedback is stored privately and is visible to authorized hospital staff.
            </small>
          </form>
        </div>
      </section>

      {/* 11 ACCESSIBILITY */}
      <section className="dept-section dept-accessibility-section">
        <SectionHeading
          eyebrow="11 — ACCESSIBILITY & DEPARTMENT NAVIGATION"
          title="Navigate the Hospital with Confidence"
          description="Understand physical accessibility features and the location of hospital departments."
        />

        <div className="dept-accessibility-grid">
          {[
            ["♿", "Wheelchair Access", "Accessible entrance and route information."],
            ["🛗", "Elevator Information", "Elevator locations and accessible floors."],
            ["📍", "Floor & Building Location", "Department building and floor directory."],
            ["🧏", "Sign Language Support", "Verified sign-language assistance availability."],
            ["🪧", "Department Signage", "Wayfinding and department sign information."],
            ["🧭", "Accessible Routes", "Step-free route and navigation information."],
          ].map(([icon, title, description]) => (
            <article className="dept-accessibility-card" key={title}>
              <span>{icon}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
                <small>Hospital information verification pending</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 12 CONTACT DIRECTORY */}
      <section className="dept-section dept-contact-section">
        <SectionHeading
          eyebrow="12 — DEPARTMENT CONTACT DIRECTORY"
          title="Department Contact Information"
          description="Find official department contact channels and service desk information."
        />

        <div className="dept-contact-table-wrap">
          <table className="dept-contact-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Phone Extension</th>
                <th>Official Email</th>
                <th>Working Hours</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((department) => (
                <tr key={department.id}>
                  <td>{department.name}</td>
                  <td>{department.phoneExtension || "Not configured"}</td>
                  <td>{department.officialEmail || "Not configured"}</td>
                  <td>{department.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dept-contact-emergency">
          <div>
            <span>IMPORTANT</span>
            <h3>Emergency Contact Information</h3>
            <p>
              Use the hospital's officially published emergency contact
              information. Do not rely on unverified numbers.
            </p>
          </div>
          <span className="dept-emergency-icon">☎</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="dept-footer">
        <div className="dept-footer-main">
          <div className="dept-footer-brand">
            <a href="/" className="dept-brand">
              <span className="dept-brand-icon">✚</span>
              <span>PULSELINE <strong>AI</strong></span>
            </a>
            <p>
              Intelligent hospital department discovery and medical service
              information.
            </p>
          </div>

          <div>
            <h4>Explore</h4>
            <a href="/">Home</a>
            <a href="/appointment">Appointment</a>
            <a href="/ai-assistant">AI Assistant</a>
            <a href="/live-queue">Live Queue</a>
          </div>

          <div>
            <h4>Departments</h4>
            <a href="#department-directory">Department Directory</a>
            <a href="#ai-discovery">AI Discovery</a>
            <a href="#department-directory">Medical Specialties</a>
            <a href="#dept-contact">Contact Directory</a>
          </div>

          <div>
            <h4>Information</h4>
            <a href="#dept-knowledge">Knowledge Centre</a>
            <a href="#dept-accessibility">Accessibility</a>
            <a href="#dept-feedback">Feedback & Quality</a>
          </div>
        </div>

        <div className="dept-footer-bottom">
          <span>© 2026 PULSELINE. All rights reserved.</span>
          <span>Department information must be verified by the hospital.</span>
        </div>
      </footer>

      {/* DEPARTMENT PROFILE MODAL */}
      {selectedDepartment && (
        <div
          className="dept-modal-overlay"
          onClick={closeDepartment}
          role="presentation"
        >
          <div
            className="dept-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dept-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="dept-modal-close"
              type="button"
              onClick={closeDepartment}
              aria-label="Close department profile"
            >
              ×
            </button>

            <div className={`dept-modal-icon ${selectedDepartment.color}`}>
              {selectedDepartment.icon}
            </div>

            <span className="dept-eyebrow">DEPARTMENT PROFILE</span>
            <h2 id="dept-modal-title">{selectedDepartment.name}</h2>
            <p>{selectedDepartment.description}</p>

            <div className="dept-modal-block">
              <h4>Medical services</h4>
              <ul>
                {selectedDepartment.services.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            </div>

            <div className="dept-modal-block">
              <h4>Diagnostic facilities</h4>
              <ul>
                {selectedDepartment.facilities.map((facility) => (
                  <li key={facility}>{facility}</li>
                ))}
              </ul>
            </div>

            <div className="dept-modal-information">
              <p><strong>Location:</strong> {selectedDepartment.floor}</p>
              <p><strong>Hours:</strong> {selectedDepartment.hours}</p>
              <p><strong>Contact:</strong> {selectedDepartment.contact}</p>
            </div>

            <small>
              Illustrative profile. Confirm all services, facilities,
              locations and hours with the hospital.
            </small>
          </div>
        </div>
      )}
    </div>
  );
}

export default Departments;
