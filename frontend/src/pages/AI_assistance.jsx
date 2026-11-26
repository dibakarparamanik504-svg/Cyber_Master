
import React, { useEffect, useRef, useState } from "react";
import "./AI_assistance.css";

const API_URL = (process.env.REACT_APP_API_URL || "/api").replace(/\/$/, "");

const languages = [
  { code: "en-IN", name: "English", native: "English" },
  { code: "bn-IN", name: "Bengali", native: "বাংলা" },
  { code: "hi-IN", name: "Hindi", native: "हिन्दी" },
  { code: "or-IN", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "ta-IN", name: "Tamil", native: "தமிழ்" },
  { code: "te-IN", name: "Telugu", native: "తెలుగు" },
];

const initialMessages = [
  {
    id: 1,
    role: "assistant",
    text: "Hello! I am PULSELINE. How can I help you today?",
    time: "Now",
    source: "PULSELINE",
  },
];

function AIAssistant() {
  const [messages, setMessages] = useState(initialMessages);
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [simplifiedMode, setSimplifiedMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [conversationId, setConversationId] = useState(null);

  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  const addMessage = (role, text, extra = {}) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      role,
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ...extra,
    };

    setMessages((previous) => [...previous, newMessage]);
  };

  const sendMessage = async (event) => {
    if (event) event.preventDefault();

    const text = message.trim();

    if ((!text && !selectedFile) || loading) return;

    setError("");
    addMessage("user", text || `Uploaded: ${selectedFile.name}`, {
      fileName: selectedFile?.name || null,
    });

    setMessage("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", text);
      formData.append("language", language);
      formData.append("simplified_mode", String(simplifiedMode));

      if (conversationId) {
        formData.append("conversation_id", conversationId);
      }

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await fetch(`${API_URL}/ai-assistant/chat/`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error(
          `The AI endpoint ${API_URL}/ai-assistant/chat/ returned HTML or invalid JSON (HTTP ${response.status}). Start Django at http://127.0.0.1:8000 and use the React development URL printed by npm start so /api requests are proxied to Django.`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            Object.entries(data)
              .map(([field, messages]) =>
                `${field}: ${Array.isArray(messages) ? messages.join(" ") : messages}`
              )
              .join("; ") ||
            `AI service returned an error (${response.status}).`
        );
      }

      const answer =
        data.answer || data.reply || data.response || data.message;

      if (!answer) {
        throw new Error("The AI service returned an empty response.");
      }

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      addMessage("assistant", answer, {
        source: data.source || "PULSELINE",
        confidence:
          typeof data.confidence === "number"
            ? data.confidence
            : null,
        references: Array.isArray(data.sources) ? data.sources : [],
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      const errorMessage =
        err.message || "Unable to connect to PULSELINE. Please try again.";
      setError(errorMessage);
      addMessage("system", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Try Chrome or Edge."
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setListening(true);
      setError("");
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setMessage(transcript);
    };

    recognition.onerror = () => {
      setError("Voice recognition failed. Please try again.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const speakMessage = (text) => {
    if (!voiceEnabled) return;

    if (!window.speechSynthesis) {
      setError("Text-to-speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, WEBP, PDF or TXT file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const clearConversation = () => {
    window.speechSynthesis?.cancel();
    setMessages(initialMessages);
    setConversationId(null);
    setError("");
    setSelectedFile(null);
    setMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const quickPrompts = [
    "Explain hospital information",
    "Help me understand a medical document",
    "What documents should I prepare?",
    "Explain this information in simple language",
  ];

  return (
    <div className="smartq-ai-page">
      <header className="ai-navbar">
        <a href="/" className="ai-brand">
          <span className="ai-brand-icon">✚</span>
          <span>
            <strong>PULSELINE <b>AI</b></strong>
            <small>INTELLIGENT HEALTHCARE</small>
          </span>
        </a>

        <nav className="ai-nav-links">
          <a href="/">HOME</a>
          <a href="/appointment">APPOINTMENT</a>
          <a href="/ai-assistant" className="ai-nav-active">
            AI ASSISTANT
          </a>
          <a href="/live-queue">LIVE QUEUE</a>
          <a href="/departments">DEPARTMENTS</a>
        </nav>

        <div className="ai-navbar-status">
          <span className="ai-status-dot"></span>
          AI ASSISTANT
        </div>
      </header>

      <main>
        {/* 01 - HERO */}
        <section className="ai-hero">
          <div className="ai-hero-content">
            <span className="ai-eyebrow">
              GEMINI-POWERED INTELLIGENCE
            </span>

            <h1>
              Your Intelligent
              <span> Healthcare Assistant</span>
            </h1>

            <p>
              Talk, type or share information to interact with
              PULSELINE. Get accessible, multilingual assistance
              powered by intelligent AI technology.
            </p>

            <div className="ai-hero-features">
              <span>✦ Gemini AI</span>
              <span>◉ Voice Interaction</span>
              <span>文 Multilingual</span>
            </div>

            <a href="#ai-chat" className="ai-primary-button">
              Start Conversation <span>→</span>
            </a>
          </div>

          <div className="ai-hero-visual">
            <div className="ai-orbit ai-orbit-one"></div>
            <div className="ai-orbit ai-orbit-two"></div>
            <div className="ai-hero-center">
              <span>✚</span>
              <strong>PULSELINE</strong>
              <small>AI ASSISTANT</small>
            </div>
            <div className="ai-orbit-label ai-orbit-label-one">
              <span>✦</span> Gemini
            </div>
            <div className="ai-orbit-label ai-orbit-label-two">
              <span>◉</span> Voice AI
            </div>
            <div className="ai-orbit-label ai-orbit-label-three">
              <span>文</span> Languages
            </div>
          </div>
        </section>

        {/* 02 - CHAT */}
        <section className="ai-section" id="ai-chat">
          <div className="ai-section-heading">
            <span className="ai-eyebrow">02 — AI CONVERSATION CENTRE</span>
            <h2>Chat with PULSELINE</h2>
            <p>
              Ask general questions and get support with hospital
              information. AI responses are not verified hospital guidance.
            </p>
          </div>

          <div className="ai-chat-layout">
            <div className="ai-chat-main">
              <div className="ai-chat-header">
                <div className="ai-chat-profile">
                  <div className="ai-avatar">✚</div>
                  <div>
                    <strong>PULSELINE</strong>
                    <small>
                      <span className="ai-status-dot"></span>
                      Assistant interface
                    </small>
                  </div>
                </div>

                <button
                  type="button"
                  className="ai-clear-button"
                  onClick={clearConversation}
                >
                  ↻ New Chat
                </button>
              </div>

              <div className="ai-message-area">
                {messages.map((item) => (
                  <div
                    key={item.id}
                    className={`ai-message-row ${item.role}`}
                  >
                    {item.role === "assistant" && (
                      <div className="ai-message-avatar">✚</div>
                    )}

                    <div className="ai-message-content">
                      <div className="ai-message-bubble">
                        {item.text}
                      </div>

                      {item.fileName && (
                        <small className="ai-file-caption">
                          📎 {item.fileName}
                        </small>
                      )}

                      {item.references?.length > 0 && (
                        <div className="ai-source-list">
                          <strong>Information sources</strong>
                          {item.references.map((source, index) => (
                            <div key={index}>
                              {typeof source === "string"
                                ? source
                                : source.title || source.name || "Source"}
                            </div>
                          ))}
                        </div>
                      )}

                      {item.role === "assistant" && (
                        <button
                          type="button"
                          className="ai-speak-button"
                          onClick={() => speakMessage(item.text)}
                        >
                          🔊 Listen
                        </button>
                      )}

                      <small className="ai-message-time">
                        {item.time}
                        {item.source ? ` · ${item.source}` : ""}
                      </small>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="ai-message-row assistant">
                    <div className="ai-message-avatar">✚</div>
                    <div className="ai-message-bubble ai-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                      PULSELINE is thinking...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef}></div>
              </div>

              {error && (
                <div className="ai-error-message" role="alert">
                  {error}
                  <button type="button" onClick={() => setError("")}>
                    ×
                  </button>
                </div>
              )}

              {selectedFile && (
                <div className="ai-selected-file">
                  <span>📎 {selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}

              <form className="ai-chat-input-area" onSubmit={sendMessage}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.txt"
                  hidden
                  onChange={handleFileChange}
                />

                <button
                  type="button"
                  className="ai-input-tool"
                  title="Attach image or document"
                  onClick={() => fileInputRef.current?.click()}
                >
                  ＋
                </button>

                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ask PULSELINE a question..."
                  rows="1"
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                />

                <button
                  type="button"
                  className={`ai-input-tool ${listening ? "recording" : ""}`}
                  onClick={startVoiceRecognition}
                  title="Voice input"
                >
                  {listening ? "■" : "🎙"}
                </button>

                <button
                  type="submit"
                  className="ai-send-button"
                  disabled={loading || (!message.trim() && !selectedFile)}
                >
                  ➤
                </button>
              </form>

              <div className="ai-chat-disclaimer">
                PULSELINE provides general hospital information, not
                medical diagnosis or treatment.
              </div>
            </div>

            {/* QUICK PROMPTS */}
            <aside className="ai-chat-sidebar">
              <div className="ai-sidebar-card">
                <h3>Suggested Questions</h3>
                <p>Start with one of these questions.</p>

                {quickPrompts.map((prompt) => (
                  <button
                    type="button"
                    className="ai-prompt-button"
                    key={prompt}
                    onClick={() => setMessage(prompt)}
                  >
                    <span>✦</span>
                    {prompt}
                    <b>→</b>
                  </button>
                ))}
              </div>

              <div className="ai-sidebar-card ai-sidebar-info">
                <span className="ai-info-icon">ⓘ</span>
                <h3>Verified Information</h3>
                <p>
                  Answers should be grounded in approved hospital
                  information and show their sources when available.
                </p>
              </div>

              <div className="ai-sidebar-card ai-sidebar-info">
                <span className="ai-info-icon">♧</span>
                <h3>Privacy Reminder</h3>
                <p>
                  Avoid sharing passwords, payment details or
                  unnecessary sensitive personal information.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* 03 - VOICE INTELLIGENCE */}
        <section className="ai-section ai-section-soft">
          <div className="ai-section-heading">
            <span className="ai-eyebrow">03 — AI VOICE INTELLIGENCE</span>
            <h2>Advanced Voice Interaction</h2>
            <p>
              Interact with the assistant using supported browser
              speech technologies.
            </p>
          </div>

          <div className="ai-feature-grid">
            {[
              ["🎙", "Speech-to-Text Recognition", "Convert spoken questions into text."],
              ["◉", "Natural Voice Conversation", "Interact through supported voice controls."],
              ["🔊", "Text-to-Speech Responses", "Listen to assistant responses."],
              ["⌘", "Voice Command Understanding", "Interpret speech as a user query."],
              ["〰", "Noise-Resistant Processing", "Use supported browser microphone processing."],
              ["文", "Voice Language Detection", "Select a supported recognition language."],
            ].map(([icon, title, description]) => (
              <div className="ai-feature-card" key={title}>
                <span className="ai-feature-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>

          <div className="ai-voice-control">
            <div>
              <strong>{listening ? "Listening..." : "Voice Input"}</strong>
              <p>
                {listening
                  ? "Speak clearly into your microphone."
                  : "Start voice recognition using the microphone button in chat."}
              </p>
            </div>
            <button
              type="button"
              className={`ai-voice-button ${listening ? "recording" : ""}`}
              onClick={startVoiceRecognition}
            >
              {listening ? "■ Stop Listening" : "🎙 Start Listening"}
            </button>
            <button
              type="button"
              className="ai-secondary-button"
              disabled={!voiceEnabled}
              onClick={speaking ? stopSpeaking : () => {
                const lastAnswer = [...messages]
                  .reverse()
                  .find((item) => item.role === "assistant");
                if (lastAnswer) speakMessage(lastAnswer.text);
              }}
            >
              {speaking ? "Stop Audio" : "🔊 Play Last Answer"}
            </button>
          </div>
        </section>

        {/* 04 - MULTILINGUAL */}
        <section className="ai-section">
          <div className="ai-section-heading">
            <span className="ai-eyebrow">04 — MULTILINGUAL AI</span>
            <h2>Multilingual Communication Engine</h2>
            <p>
              Choose your preferred language for voice input and
              spoken and AI text responses. The assistant replies in
              the selected language.
            </p>
          </div>

          <div className="ai-language-grid">
            {languages.map((item) => (
              <button
                type="button"
                key={item.code}
                className={`ai-language-card ${
                  language === item.code ? "selected" : ""
                }`}
                onClick={() => setLanguage(item.code)}
              >
                <span>{item.native}</span>
                <strong>{item.name}</strong>
                <small>
                  {language === item.code ? "Selected ✓" : "Select language"}
                </small>
              </button>
            ))}
          </div>
          <p className="ai-language-note">
            AI text replies support English, Bengali, Hindi, Odia,
            Tamil, and Telugu. Voice recognition depends on browser support.
          </p>
        </section>

        {/* 05 - CONTEXTUAL INTELLIGENCE */}
        <section className="ai-section ai-section-soft">
          <div className="ai-section-heading">
            <span className="ai-eyebrow">05 — CONTEXTUAL INTELLIGENCE</span>
            <h2>Advanced Gemini Reasoning</h2>
            <p>
              Context-aware responses with backend verification and
              conversation controls.
            </p>
          </div>

          <div className="ai-feature-grid">
            {[
              ["◈", "Context-Aware Conversations", "Use relevant previous messages in the current conversation."],
              ["↻", "Conversation Memory", "Maintain conversation context using a conversation identifier."],
              ["⌕", "Intent Recognition", "Identify the purpose of a user's question."],
              ["↳", "Follow-up Understanding", "Relate follow-up questions to earlier messages."],
              ["?", "Ambiguous Query Clarification", "Ask for clarification when a question is unclear."],
              ["✦", "Contextual Response Generation", "Generate responses using the available context."],
              ["✓", "Hallucination and Source Checking", "Validate answers against approved sources."],
            ].map(([icon, title, description]) => (
              <div className="ai-feature-card" key={title}>
                <span className="ai-feature-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 06 - MULTIMODAL */}
        <section className="ai-section">
          <div className="ai-section-heading">
            <span className="ai-eyebrow">06 — MULTIMODAL AI</span>
            <h2>AI Document & Image Understanding</h2>
            <p>
              Share supported files for processing by the connected
              backend AI service.
            </p>
          </div>

          <div className="ai-feature-grid four-grid">
            {[
              ["▤", "Document Understanding", "PDF and text document processing."],
              ["▧", "Image Understanding", "Supported image analysis."],
              ["⌗", "Text Extraction (OCR)", "Extract text using a connected OCR service."],
              ["文", "Document Translation", "Translate extracted content through the AI backend."],
            ].map(([icon, title, description]) => (
              <div className="ai-feature-card" key={title}>
                <span className="ai-feature-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <button
                  type="button"
                  className="ai-text-link"
                  onClick={() => {
                    document.getElementById("ai-chat")?.scrollIntoView({
                      behavior: "smooth",
                    });
                    fileInputRef.current?.click();
                  }}
                >
                  Upload file →
                </button>
              </div>
            ))}
          </div>
          <p className="ai-language-note">
            File upload in this interface accepts JPG, PNG, WEBP,
            PDF and TXT files up to 10 MB. Actual OCR and document
            analysis require backend implementation.
          </p>
        </section>

        {/* 07 - RAG */}
        <section className="ai-section ai-section-soft">
          <div className="ai-section-heading">
            <span className="ai-eyebrow">07 — HOSPITAL KNOWLEDGE RAG</span>
            <h2>Verified Hospital Knowledge Assistant</h2>
            <p>
              Ground AI responses in approved hospital documents
              instead of relying on unsupported assumptions.
            </p>
          </div>

          <div className="ai-feature-grid three-grid">
            {[
              ["⌕", "Hospital Knowledge Retrieval", "Retrieve relevant approved hospital documents."],
              ["✓", "Verified Information Sources", "Use reviewed and maintained information."],
              ["▤", "Document-Based Question Answering", "Answer questions using retrieved documents."],
              ["⌗", "Source Citation", "Show references returned by the backend."],
              ["↻", "Knowledge Update Synchronization", "Refresh indexed information when documents change."],
              ["!", "Unknown-Answer Detection", "Avoid presenting unsupported information as fact."],
            ].map(([icon, title, description]) => (
              <div className="ai-feature-card" key={title}>
                <span className="ai-feature-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 08 - PERSONALIZATION */}
        <section className="ai-section">
          <div className="ai-section-heading">
            <span className="ai-eyebrow">08 — AI PERSONALIZATION</span>
            <h2>Adaptive AI Experience</h2>
            <p>
              Adjust how the assistant communicates with you.
            </p>
          </div>

          <div className="ai-settings-panel">
            <div className="ai-setting-row">
              <div>
                <strong>Preferred Language</strong>
                <p>Use the selected language for speech controls.</p>
              </div>
              <span className="ai-setting-value">
                {languages.find((item) => item.code === language)?.name}
              </span>
            </div>

            <div className="ai-setting-row">
              <div>
                <strong>Voice Response</strong>
                <p>Control spoken responses in the chat interface.</p>
              </div>
              <label className="ai-toggle">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setVoiceEnabled(enabled);
                    if (!enabled) stopSpeaking();
                  }}
                />
                <span></span>
              </label>
            </div>

            <div className="ai-setting-row">
              <div>
                <strong>Simplified Explanation Mode</strong>
                <p>Request simpler explanations from the AI backend.</p>
              </div>
              <label className="ai-toggle">
                <input
                  type="checkbox"
                  checked={simplifiedMode}
                  onChange={(event) => setSimplifiedMode(event.target.checked)}
                />
                <span></span>
              </label>
            </div>

            <div className="ai-setting-row">
              <div>
                <strong>Conversation History</strong>
                <p>Keep earlier messages visible in this session.</p>
              </div>
              <label className="ai-toggle">
                <input
                  type="checkbox"
                  checked={showHistory}
                  onChange={(event) => {
                    setShowHistory(event.target.checked);
                    if (!event.target.checked) {
                      clearConversation();
                    }
                  }}
                />
                <span></span>
              </label>
            </div>
          </div>

          <p className="ai-language-note">
            These are interface preferences. Persistent user
            preferences require authenticated backend storage.
          </p>
        </section>

        {/* 09 - SAFETY */}
        <section className="ai-section ai-section-soft">
          <div className="ai-section-heading">
            <span className="ai-eyebrow">09 — AI SAFETY & PRIVACY</span>
            <h2>Responsible AI Protection</h2>
            <p>
              Safety controls should be enforced by the backend
              before AI responses are displayed.
            </p>
          </div>

          <div className="ai-safety-grid">
            {[
              ["◈", "Sensitive Information Detection", "Identify unnecessary personal information."],
              ["♧", "Personal Data Protection", "Apply privacy and data-minimization rules."],
              ["🔒", "Secure Conversation Handling", "Protect stored conversation records."],
              ["✚", "Medical Advice Safety Filters", "Prevent diagnosis and prescription claims."],
              ["⚠", "Emergency Escalation Guidance", "Direct urgent situations to appropriate emergency services."],
              ["✓", "AI Response Confidence Indicators", "Display confidence only when meaningfully calculated."],
            ].map(([icon, title, description]) => (
              <div className="ai-safety-card" key={title}>
                <span>{icon}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="ai-medical-warning">
            <span>⚠</span>
            <div>
              <strong>Healthcare Safety Notice</strong>
              <p>
                PULSELINE provides general hospital information and
                document explanations. It does not independently
                diagnose illnesses or prescribe treatment. For
                emergencies, contact local emergency services or
                seek immediate medical care.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="ai-footer">
        <div className="ai-footer-main">
          <div className="ai-footer-brand">
            <a href="/" className="ai-brand">
              <span className="ai-brand-icon">✚</span>
              <span>
                <strong>PULSELINE <b>AI</b></strong>
                <small>INTELLIGENT HEALTHCARE</small>
              </span>
            </a>
            <p>
              Gemini Intelligence · Voice AI · Multilingual
              Communication
            </p>
          </div>

          <div className="ai-footer-links">
            <strong>Navigation</strong>
            <a href="/">Home</a>
            <a href="/appointment">Appointment</a>
            <a href="/live-queue">Live Queue</a>
            <a href="/departments">Departments</a>
          </div>

          <div className="ai-footer-links">
            <strong>AI Assistant</strong>
            <a href="#ai-chat">Conversation Centre</a>
            <a href="#ai-chat">Voice Interaction</a>
            <a href="#ai-chat">Document Upload</a>
          </div>
        </div>

        <div className="ai-footer-bottom">
          <span>© 2026 PULSELINE. All rights reserved.</span>
          <span>Smart communication · Responsible AI · Secure information</span>
        </div>
      </footer>
    </div>
  );
}

export default AIAssistant;
