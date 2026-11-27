export const featurePages = {
  aiIntelligenceEngine: {
    icon: "🧠",
    category: "HOSPITAL INTELLIGENCE",
    title: "AI Intelligence Engine",
    description:
      "A central workspace for AI-assisted hospital information, designed to make approved information easier to find and understand.",
    status: "AI ASSISTANT AVAILABLE",
    notice:
      "Hospital data integrations and source verification must be configured before this page can provide hospital-specific intelligence.",
    metrics: [
      {
        label: "AI assistant",
        value: "Available",
        note: "Open the assistant to ask general questions.",
      },
      {
        label: "Hospital data sources",
        value: "Not connected",
        note: "Verified source connections are required.",
      },
      {
        label: "Decision support",
        value: "Informational",
        note: "AI output is not a clinical or operational decision.",
      },
    ],
    capabilities: [
      {
        title: "Information discovery",
        description:
          "Help staff and visitors find approved hospital information through natural-language questions.",
      },
      {
        title: "Multilingual assistance",
        description:
          "Use the PULSELINE AI assistant's available language options for accessible communication.",
      },
      {
        title: "Source-aware responses",
        description:
          "Connect verified hospital content before presenting hospital-specific answers or recommendations.",
      },
      {
        title: "Human oversight",
        description:
          "Keep clinical, safety, and operational decisions with qualified hospital personnel.",
      },
    ],
    action: {
      label: "Open AI Assistant",
      to: "/ai-assistant",
    },
  },
  predictiveAnalytics: {
    icon: "📈",
    category: "PREDICTIVE INTELLIGENCE",
    title: "Predictive Analytics",
    description:
      "A common workspace for forecasting demand and identifying trends from validated historical hospital data.",
    status: "MODEL AND DATA REQUIRED",
    notice:
      "No forecasting model or historical dataset is connected. Forecasts are not displayed until an approved data source and validated model are configured.",
    metrics: [
      {
        label: "Forecast model",
        value: "Not connected",
        note: "A validated model is required.",
      },
      {
        label: "Historical data",
        value: "Not connected",
        note: "Approved, quality-checked data is required.",
      },
      {
        label: "Forecast status",
        value: "Unavailable",
        note: "No predictions are being generated.",
      },
    ],
    capabilities: [
      {
        title: "Capacity forecasting",
        description:
          "Estimate future bed and service demand after validated capacity data is connected.",
      },
      {
        title: "Resource planning",
        description:
          "Explore staffing and resource trends using approved historical operational records.",
      },
      {
        title: "Equipment trends",
        description:
          "Identify potential maintenance patterns when equipment and maintenance data are integrated.",
      },
      {
        title: "Forecast evaluation",
        description:
          "Compare model predictions with observed outcomes and review model performance over time.",
      },
    ],
  },
  operationalInsights: {
    icon: "📊",
    category: "OPERATIONAL PERFORMANCE",
    title: "Operational Insights",
    description:
      "Review available live-queue analytics and understand which hospital performance indicators still need connected data.",
    status: "LIVE QUEUE ANALYTICS",
    endpoint: "/queue/analytics/",
    notice:
      "Queue metrics reflect confirmed appointments for the current day. Other operational indicators require their own verified data integrations.",
    metrics: [
      {
        label: "Completion rate",
        field: "completion_rate",
        suffix: "%",
        fallback: "Unavailable",
        note: "Share of today's confirmed queue tickets completed.",
      },
      {
        label: "Delay frequency",
        field: "delay_frequency",
        suffix: "%",
        fallback: "Unavailable",
        note: "Share of today's confirmed queue tickets marked delayed.",
      },
      {
        label: "Average wait",
        field: "average_wait_minutes",
        suffix: " min",
        fallback: "Not reported",
        note: "Displayed only when the queue service reports a value.",
      },
    ],
    chart: {
      field: "hourly_volume",
      title: "Today's appointment volume",
      description: "Confirmed queue appointments by scheduled hour.",
    },
    capabilities: [
      {
        title: "Queue performance",
        description:
          "Monitor appointment completion, delay frequency, and hourly volume from the live queue service.",
      },
      {
        title: "Demand patterns",
        description:
          "Use hourly appointment volume to identify busy periods; historical trend analysis needs additional data.",
      },
      {
        title: "Service bottlenecks",
        description:
          "Add verified service-stage data to investigate where patient flow slows down.",
      },
      {
        title: "Operational reporting",
        description:
          "Extend this dashboard with authorized staffing, capacity, and service data integrations.",
      },
    ],
  },
  hospitalRiskMonitor: {
    icon: "🛡️",
    category: "RISK AND READINESS",
    title: "Hospital Risk Monitor",
    description:
      "A structured view for monitoring verified infrastructure and operational risk indicators with clear human review.",
    status: "RISK DATA REQUIRED",
    notice:
      "No live risk records or monitoring feeds are connected. This page does not assess or certify hospital safety.",
    metrics: [
      {
        label: "Risk records",
        value: "Not connected",
        note: "A verified risk register is required.",
      },
      {
        label: "Monitoring feeds",
        value: "Not connected",
        note: "Approved operational feeds are required.",
      },
      {
        label: "Review status",
        value: "Not assessed",
        note: "Risk review must be completed by authorized staff.",
      },
    ],
    capabilities: [
      {
        title: "Infrastructure readiness",
        description:
          "Track reviewed facilities and equipment indicators when verified inspection data is available.",
      },
      {
        title: "Operational continuity",
        description:
          "Organize continuity risks and mitigation ownership using an approved hospital risk register.",
      },
      {
        title: "Risk follow-up",
        description:
          "Record review dates, accountable owners, and mitigation progress after a risk-management workflow is connected.",
      },
      {
        title: "Human review",
        description:
          "Require authorized staff to assess, prioritize, and act on every risk indicator.",
      },
    ],
  },
};
