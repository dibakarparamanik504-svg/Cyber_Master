
import React, { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./appointment.css";

const API_BASE_URL = (process.env.REACT_APP_API_URL || "/api").replace(/\/$/, "");

const APPOINTMENT_TYPES = [
  "New Consultation",
  "Follow-up Visit",
  "Routine Check-up",
  "Specialist Consultation",
];

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM",
];

const initialForm = {
  patientName: "",
  age: "",
  gender: "",
  mobile: "",
  email: "",
  patientId: "",
  date: "",
  time: "",
  type: "New Consultation",
  visit: "First Visit",
  reason: "",
};

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function requestAppointments(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const result = await response.json();

  if (!response.ok) {
    const detail =
      result.detail ||
      Object.entries(result)
        .map(([field, messages]) =>
          `${field}: ${Array.isArray(messages) ? messages.join(" ") : messages}`
        )
        .join("; ");
    throw new Error(detail || `Request failed (${response.status}).`);
  }

  return result;
}

function Appointment() {
  const [form, setForm] = useState(initialForm);
  const [appointments, setAppointments] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchReference, setSearchReference] = useState("");
  const [reminders, setReminders] = useState({
    appointment: true,
    reschedule: true,
    cancellation: true,
    confirmation: true,
    missed: true,
  });

  useEffect(() => {
    let active = true;
    requestAppointments("/appointments/")
      .then((saved) => {
        if (!active) return;
        setAppointments(saved);
        setSelectedAppointment(saved[0] || null);
      })
      .catch((error) => {
        if (active) setMessage(`Could not load appointments: ${error.message}`);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setMessage("");
  };

  useEffect(() => {
    if (!form.date) {
      setBookedSlots([]);
      return undefined;
    }

    let active = true;
    requestAppointments(
      `/appointments/availability/?date=${encodeURIComponent(form.date)}`
    )
      .then((availability) => {
        if (active) setBookedSlots(availability.occupiedSlots);
      })
      .catch((error) => {
        if (active) setMessage(`Could not load available slots: ${error.message}`);
      });

    return () => {
      active = false;
    };
  }, [form.date]);

  const occupiedSlots = useMemo(() => {
    if (!form.date) return [];
    const appointmentTimeToIgnore =
      selectedAppointment?.date === form.date ? selectedAppointment.time : null;
    return bookedSlots.filter((slot) => slot !== appointmentTimeToIgnore);
  }, [bookedSlots, form.date, selectedAppointment]);

  const availableSlots = TIME_SLOTS.filter(
    (slot) => !occupiedSlots.includes(slot)
  );

  const recommendedSlot = availableSlots.includes("10:00 AM")
    ? "10:00 AM"
    : availableSlots[0] || "";

  const handleRecommendation = () => {
    if (!form.date) {
      setMessage("Select an appointment date first.");
      return;
    }

    if (!recommendedSlot) {
      setMessage("No available appointment slots for this date.");
      return;
    }

    setForm((previous) => ({ ...previous, time: recommendedSlot }));
    setMessage(`Recommended time selected: ${recommendedSlot}`);
  };

  const validateForm = () => {
    if (
      !form.patientName.trim() ||
      !form.age ||
      !form.gender ||
      !form.mobile.trim() ||
      !form.date ||
      !form.time ||
      !form.type ||
      !form.reason.trim()
    ) {
      setMessage("Please complete all required fields.");
      return false;
    }

    if (!/^[0-9]{10}$/.test(form.mobile)) {
      setMessage("Enter a valid 10-digit mobile number.");
      return false;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setMessage("Enter a valid email address.");
      return false;
    }

    if (Number(form.age) < 1 || Number(form.age) > 120) {
      setMessage("Enter an age between 1 and 120.");
      return false;
    }

    if (form.date < getToday()) {
      setMessage("Appointment date cannot be in the past.");
      return false;
    }

    if (occupiedSlots.includes(form.time)) {
      setMessage("This time slot is already booked. Select another slot.");
      return false;
    }

    return true;
  };

  const handleBooking = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const booking = await requestAppointments("/appointments/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setAppointments((previous) => [booking, ...previous]);
      setSelectedAppointment(booking);
      setForm(initialForm);
      setMessage("Appointment booked successfully.");
      setActiveTab("upcoming");
    } catch (error) {
      setMessage(`Could not book appointment: ${error.message}`);
    }
  };

  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setForm({
      patientName: appointment.patientName,
      age: appointment.age,
      gender: appointment.gender,
      mobile: appointment.mobile,
      email: appointment.email,
      patientId: appointment.patientId,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      visit: appointment.visit,
      reason: appointment.reason,
    });

    document.getElementById("booking")?.scrollIntoView({
      behavior: "smooth",
    });
    setMessage("Edit the date and time, then save your changes.");
  };

  const saveReschedule = async (event) => {
    event.preventDefault();

    if (!selectedAppointment) {
      handleBooking(event);
      return;
    }

    if (!validateForm()) return;

    try {
      const updatedAppointment = await requestAppointments(
        `/appointments/${encodeURIComponent(selectedAppointment.reference)}/`,
        {
          method: "PUT",
          body: JSON.stringify(form),
        }
      );
      setAppointments((previous) =>
        previous.map((item) =>
          item.reference === updatedAppointment.reference
            ? updatedAppointment
            : item
        )
      );
      setSelectedAppointment(null);
      setForm(initialForm);
      setMessage("Appointment rescheduled successfully.");
    } catch (error) {
      setMessage(`Could not reschedule appointment: ${error.message}`);
    }
  };

  const handleCancel = async (reference) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) return;

    try {
      const cancelledAppointment = await requestAppointments(
        `/appointments/${encodeURIComponent(reference)}/`,
        { method: "DELETE" }
      );
      setAppointments((previous) =>
        previous.map((item) =>
          item.reference === reference ? cancelledAppointment : item
        )
      );
      if (selectedAppointment?.reference === reference) {
        setSelectedAppointment(null);
      }
      setMessage("Appointment cancelled.");
    } catch (error) {
      setMessage(`Could not cancel appointment: ${error.message}`);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setSelectedAppointment(null);
    setMessage("");
  };

  const filteredAppointments = appointments.filter((item) => {
    if (activeTab === "upcoming") {
      return item.status === "Confirmed" && item.date >= getToday();
    }
    if (activeTab === "history") {
      return item.status === "Cancelled" || item.date < getToday();
    }
    return true;
  });

  const searchedAppointments = filteredAppointments.filter((item) =>
    item.reference.toLowerCase().includes(searchReference.toLowerCase())
  );

  const toggleReminder = (key) => {
    setReminders((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  return (
    <div className="appointment-page">
      <main>
        {/* 01 HERO */}
        <section className="appointment-hero" id="appointment-home">
          <div className="appointment-hero-content">
            <span className="appointment-eyebrow">
              01 / SMART APPOINTMENT SYSTEM
            </span>
            <h1>
              Smart Appointment <span>Booking</span>
            </h1>
            <p>
              Book and manage your hospital appointments through an
              intelligent digital scheduling system.
            </p>

            <div className="appointment-hero-actions">
              <a href="#booking" className="appointment-primary-button">
                Book an Appointment →
              </a>
              <a href="#manage" className="appointment-secondary-button">
                Manage Booking
              </a>
            </div>

            <div className="appointment-hero-points">
              <span>✓ AI-Powered Booking</span>
              <span>✓ Digital Confirmation</span>
              <span>✓ Secure Booking Records</span>
            </div>
          </div>

          <div className="appointment-hero-visual">
            <div className="appointment-calendar-art">
              <div className="calendar-top">
                <span>✚ PULSELINE</span>
                <span>▦</span>
              </div>
              <h3>Appointment</h3>
              <p>Choose your preferred date</p>
              <div className="calendar-days">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <span key={i}>{day}</span>
                ))}
              </div>
              <div className="calendar-dates">
                {Array.from({ length: 14 }, (_, i) => (
                  <span className={i === 8 ? "selected" : ""} key={i}>
                    {i + 1}
                  </span>
                ))}
              </div>
              <div className="calendar-confirmed">
                <span>✓</span> Smart booking system
              </div>
            </div>
            <div className="appointment-floating-label">
              <span>✦</span>
              Intelligent Scheduling
            </div>
          </div>
        </section>

        {/* 02 BOOKING FORM */}
        <section className="appointment-section" id="booking">
          <div className="appointment-section-heading">
            <span>02 / APPOINTMENT BOOKING</span>
            <h2>Book Your Appointment</h2>
            <p>Enter patient information and choose your preferred schedule.</p>
          </div>

          <form
            className="appointment-form"
            onSubmit={selectedAppointment ? saveReschedule : handleBooking}
          >
            <div className="appointment-form-heading">
              <div>
                <span className="form-step">STEP 01</span>
                <h3>Patient Information</h3>
              </div>
              <span className="required-note">* Required fields</span>
            </div>

            <div className="appointment-input-grid">
              <div className="appointment-field">
                <label>Patient Name *</label>
                <input
                  name="patientName"
                  value={form.patientName}
                  onChange={updateField}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="appointment-field">
                <label>Age *</label>
                <input
                  name="age"
                  type="number"
                  min="1"
                  max="120"
                  value={form.age}
                  onChange={updateField}
                  placeholder="Enter age"
                  required
                />
              </div>

              <div className="appointment-field">
                <label>Gender *</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={updateField}
                  required
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
              </div>

              <div className="appointment-field">
                <label>Mobile Number *</label>
                <input
                  name="mobile"
                  type="tel"
                  maxLength="10"
                  value={form.mobile}
                  onChange={updateField}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div className="appointment-field">
                <label>Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="example@email.com"
                />
              </div>

              <div className="appointment-field">
                <label>Patient ID (If Existing)</label>
                <input
                  name="patientId"
                  value={form.patientId}
                  onChange={updateField}
                  placeholder="Enter patient ID"
                />
              </div>
            </div>

            <div className="appointment-form-divider" />

            <div className="appointment-form-heading">
              <div>
                <span className="form-step">STEP 02</span>
                <h3>Booking Details</h3>
              </div>
            </div>

            <div className="appointment-input-grid">
              <div className="appointment-field">
                <label>Appointment Date *</label>
                <input
                  name="date"
                  type="date"
                  min={getToday()}
                  value={form.date}
                  onChange={updateField}
                  required
                />
              </div>

              <div className="appointment-field">
                <label>Preferred Time *</label>
                <select
                  name="time"
                  value={form.time}
                  onChange={updateField}
                  required
                >
                  <option value="">Choose time slot</option>
                  {TIME_SLOTS.map((slot) => (
                    <option
                      key={slot}
                      value={slot}
                      disabled={occupiedSlots.includes(slot)}
                    >
                      {slot} {occupiedSlots.includes(slot) ? "(Booked)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="appointment-field">
                <label>Appointment Type *</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={updateField}
                  required
                >
                  {APPOINTMENT_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="appointment-field">
                <label>Visit Category *</label>
                <select
                  name="visit"
                  value={form.visit}
                  onChange={updateField}
                  required
                >
                  <option>First Visit</option>
                  <option>Follow-up</option>
                </select>
              </div>

              <div className="appointment-field full-width">
                <label>Booking Reason *</label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={updateField}
                  placeholder="Briefly describe the reason for your appointment"
                  required
                />
              </div>
            </div>

            <div className="slot-recommendation">
              <div>
                <span className="recommendation-icon">✦</span>
                <div>
                  <strong>Smart Slot Recommendation</strong>
                  <p>
                    {form.date
                      ? recommendedSlot
                        ? `Suggested available time: ${recommendedSlot}`
                        : "No available demo slots for this date."
                      : "Select a date to see a suggested time."}
                  </p>
                </div>
              </div>
              <button type="button" onClick={handleRecommendation}>
                Recommend Slot ↗
              </button>
            </div>

            <div className="appointment-form-actions">
              <button
                type="button"
                className="appointment-reset-button"
                onClick={resetForm}
              >
                Clear Form
              </button>
              <button type="submit" className="appointment-submit-button">
                {selectedAppointment
                  ? "Save Rescheduled Appointment →"
                  : "Confirm Appointment →"}
              </button>
            </div>

            {message && (
              <div className="appointment-message" role="status">
                {message}
              </div>
            )}
          </form>
        </section>

        {/* 03 SMART BOOKING */}
        <section className="appointment-section appointment-soft-section">
          <div className="appointment-section-heading">
            <span>03 / AI SMART BOOKING</span>
            <h2>Intelligent Appointment Optimizer</h2>
            <p>
              Scheduling assistance to help patients choose suitable
              appointment times.
            </p>
          </div>

          <div className="appointment-feature-grid">
            <article className="appointment-feature-card">
              <span>✦</span>
              <h3>Smart Slot Recommendation</h3>
              <p>Suggest an available time based on your selected date.</p>
              <small>LOCAL DEMO LOGIC</small>
            </article>
            <article className="appointment-feature-card">
              <span>⚠</span>
              <h3>Appointment Conflict Detection</h3>
              <p>Prevent two confirmed bookings from using the same slot.</p>
              <small>BACKEND VALIDATION</small>
            </article>
            <article className="appointment-feature-card">
              <span>◷</span>
              <h3>Preferred-Time Matching</h3>
              <p>Choose from the available time options provided in the form.</p>
              <small>FRONTEND FEATURE</small>
            </article>
            <article className="appointment-feature-card">
              <span>⌁</span>
              <h3>Booking Priority Rules</h3>
              <p>Display scheduling rules when connected to hospital policy.</p>
              <small>BACKEND REQUIRED</small>
            </article>
          </div>
        </section>

        {/* 04 APPOINTMENT TYPES */}
        <section className="appointment-section">
          <div className="appointment-section-heading">
            <span>04 / APPOINTMENT TYPE</span>
            <h2>Choose Appointment Type</h2>
            <p>Select the type that best describes your visit.</p>
          </div>

          <div className="appointment-type-grid">
            {[
              ["✚", "New Consultation", "For a first-time consultation."],
              ["↻", "Follow-up Visit", "For a previously registered patient."],
              ["♡", "Routine Check-up", "For a general health check-up."],
              ["✧", "Specialist Consultation", "For a specialist appointment."],
            ].map(([icon, title, description]) => (
              <button
                type="button"
                className={`appointment-type-card ${
                  form.type === title ? "type-selected" : ""
                }`}
                key={title}
                onClick={() => {
                  setForm((previous) => ({ ...previous, type: title }));
                  document.getElementById("booking")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                <span>{icon}</span>
                <strong>{title}</strong>
                <small>{description}</small>
                <em>{form.type === title ? "Selected ✓" : "Choose type →"}</em>
              </button>
            ))}
          </div>
        </section>

        {/* 05 CONFIRMATION */}
        <section className="appointment-section appointment-confirmation-section">
          <div className="appointment-section-heading">
            <span>05 / APPOINTMENT CONFIRMATION</span>
            <h2>Booking Confirmation Centre</h2>
            <p>Your latest booking receipt and QR verification code.</p>
          </div>

          {selectedAppointment ? (
            <div className="appointment-receipt">
              <div className="receipt-details">
                <span className="receipt-status">✓ {selectedAppointment.status}</span>
                <h3>
                  {selectedAppointment.status === "Confirmed"
                    ? "Appointment Confirmed"
                    : `Appointment ${selectedAppointment.status}`}
                </h3>
                <p>Keep this booking reference for future use.</p>
                <div className="receipt-reference">
                  <small>BOOKING REFERENCE</small>
                  <strong>{selectedAppointment.reference}</strong>
                </div>
                <div className="receipt-information">
                  <p><b>Patient:</b> {selectedAppointment.patientName}</p>
                  <p><b>Date:</b> {selectedAppointment.date}</p>
                  <p><b>Time:</b> {selectedAppointment.time}</p>
                  <p><b>Type:</b> {selectedAppointment.type}</p>
                </div>
                {selectedAppointment.queue?.reference &&
                  selectedAppointment.queue.status !== "cancelled" && (
                    <div className="receipt-information">
                      <p>
                        <b>Queue token:</b> {selectedAppointment.queue.reference}
                      </p>
                      {selectedAppointment.queue.verificationCode && (
                        <p>
                          <b>Queue verification code:</b>{" "}
                          {selectedAppointment.queue.verificationCode}
                        </p>
                      )}
                      <a
                        href={`/live-queue?reference=${encodeURIComponent(
                          selectedAppointment.queue.reference
                        )}&verification=${encodeURIComponent(
                          selectedAppointment.queue.verificationCode || ""
                        )}#queue-tracker`}
                      >
                        Track your queue →
                      </a>
                    </div>
                  )}
              </div>
              <div className="receipt-qr">
                <QRCodeSVG
                  value={JSON.stringify({
                    reference: selectedAppointment.reference,
                    patient: selectedAppointment.patientName,
                    date: selectedAppointment.date,
                    time: selectedAppointment.time,
                  })}
                  size={160}
                  level="M"
                />
                <strong>Appointment QR Code</strong>
                <small>Demo verification code</small>
              </div>
            </div>
          ) : (
            <div className="appointment-empty-confirmation">
              <span>▣</span>
              <h3>No recent booking selected</h3>
              <p>Complete the booking form to generate a receipt and QR code.</p>
              <a href="#booking">Book Appointment →</a>
            </div>
          )}
        </section>

        {/* 06 APPOINTMENT MANAGEMENT */}
        <section className="appointment-section" id="manage">
          <div className="appointment-section-heading">
            <span>06 / APPOINTMENT MANAGEMENT</span>
            <h2>Manage Your Appointments</h2>
            <p>View, reschedule and cancel appointments linked to this browser.</p>
          </div>

          <div className="appointment-management">
            <div className="appointment-management-top">
              <div className="appointment-tabs">
                <button
                  className={activeTab === "upcoming" ? "tab-active" : ""}
                  onClick={() => setActiveTab("upcoming")}
                >
                  Upcoming
                </button>
                <button
                  className={activeTab === "history" ? "tab-active" : ""}
                  onClick={() => setActiveTab("history")}
                >
                  History
                </button>
                <button
                  className={activeTab === "all" ? "tab-active" : ""}
                  onClick={() => setActiveTab("all")}
                >
                  All Bookings
                </button>
              </div>

              <input
                className="appointment-search"
                placeholder="Search booking reference..."
                value={searchReference}
                onChange={(e) => setSearchReference(e.target.value)}
              />
            </div>

            {searchedAppointments.length === 0 ? (
              <div className="appointment-empty">
                <span>▤</span>
                <h3>No appointments found</h3>
                <p>Your matching appointment records will appear here.</p>
              </div>
            ) : (
              <div className="appointment-list">
                {searchedAppointments.map((item) => (
                  <article className="appointment-list-card" key={item.reference}>
                    <div className="appointment-list-date">
                      <span>DATE</span>
                      <strong>{item.date}</strong>
                      <small>{item.time}</small>
                    </div>

                    <div className="appointment-list-info">
                      <h3>{item.patientName}</h3>
                      <p>{item.type} · {item.visit}</p>
                      <small>{item.reference}</small>
                    </div>

                    <span
                      className={`appointment-status ${
                        item.status === "Cancelled" ? "status-cancelled" : ""
                      }`}
                    >
                      {item.status}
                    </span>

                    {item.status === "Confirmed" && item.date >= getToday() && (
                      <div className="appointment-list-actions">
                        <button onClick={() => handleReschedule(item)}>
                          Reschedule
                        </button>
                        <button
                          className="cancel-action"
                          onClick={() => handleCancel(item.reference)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 07 SMART REMINDERS */}
        <section className="appointment-section appointment-soft-section">
          <div className="appointment-section-heading">
            <span>07 / SMART REMINDERS</span>
            <h2>Intelligent Appointment Notifications</h2>
            <p>Choose which notification preferences you want enabled.</p>
          </div>

          <div className="appointment-reminder-panel">
            {[
              ["appointment", "Appointment Reminder", "Reminder before the scheduled visit."],
              ["reschedule", "Rescheduling Notification", "Notice when appointment time changes."],
              ["cancellation", "Cancellation Notification", "Notice when a booking is cancelled."],
              ["confirmation", "Digital Confirmation Notification", "Booking confirmation information."],
              ["missed", "Missed Appointment Notification", "Notice for a missed appointment."],
            ].map(([key, title, description]) => (
              <div className="appointment-reminder-row" key={key}>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
                <button
                  type="button"
                  className={`reminder-toggle ${
                    reminders[key] ? "toggle-on" : ""
                  }`}
                  aria-pressed={reminders[key]}
                  onClick={() => toggleReminder(key)}
                >
                  <span />
                </button>
              </div>
            ))}
          </div>
          <p className="appointment-reminder-note">
            Demo only: these switches save preferences during this page session.
            Actual SMS, email and push notifications require backend integration.
          </p>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="appointment-footer">
        <a href="/" className="appointment-brand">
          <span className="appointment-brand-icon">✚</span>
          <span>
            <strong>PULSELINE <em>AI</em></strong>
            <small>SMART HOSPITAL</small>
          </span>
        </a>

        <p>
          Smart booking · Secure records · Intelligent scheduling
        </p>

        <div className="appointment-footer-bottom">
          <span>© {new Date().getFullYear()} PULSELINE. All rights reserved.</span>
          <span>PAGE 02 — APPOINTMENT</span>
        </div>
      </footer>
    </div>
  );
}

export default Appointment;
