const KD_STORAGE_KEY = "krushidrishti_reports";

function kdNow() {
  return Date.now();
}

function kdReadReports() {
  try {
    const raw = localStorage.getItem(KD_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

function kdWriteReports(reports) {
  localStorage.setItem(KD_STORAGE_KEY, JSON.stringify(reports));
}

function kdSeverity(confidence) {
  const c = Number(confidence) || 0;
  if (c >= 0.88) return "severe";
  if (c >= 0.75) return "high";
  if (c >= 0.55) return "moderate";
  return "low";
}

window.KD = {
  STORAGE_KEY: KD_STORAGE_KEY,
  NASHIK: { name: "Nashik", lat: 19.9975, lng: 73.7898 },
  field: {
    temp: null,
    humidity: null,
    wetHours: null,
    rainChance: null,
    spray: "—",
    dailyRisk: [],
  },

  severity: kdSeverity,

  getReports: kdReadReports,
  saveReports: kdWriteReports,

  seedIfEmpty: function seedIfEmpty() {
    if (kdReadReports().length) return;
    kdWriteReports([
      {
        id: "sample-nashik",
        labelId: "grape_black_rot",
        label: "Grape black rot",
        confidence: 0.91,
        severity: "severe",
        place: "Nashik",
        status: "pending",
        createdAt: kdNow() - 60 * 60 * 1000,
        source: "sample",
      },
      {
        id: "sample-pune",
        labelId: "tomato_early_blight",
        label: "Tomato early blight",
        confidence: 0.84,
        severity: "high",
        place: "Pune",
        status: "pending",
        createdAt: kdNow() - 3 * 60 * 60 * 1000,
        source: "sample",
      },
      {
        id: "sample-nagpur",
        labelId: "Potato___Early_blight",
        label: "Potato early blight",
        confidence: 0.64,
        severity: "moderate",
        place: "Nagpur",
        status: "pending",
        createdAt: kdNow() - 26 * 60 * 60 * 1000,
        source: "sample",
      },
    ]);
  },

  addReport: function addReport(partial) {
    const reports = kdReadReports();
    const confidence = partial.confidence;
    const report = {
      id:
        window.crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : "r-" + kdNow() + "-" + Math.floor(Math.random() * 10000),
      status: "pending",
      createdAt: kdNow(),
      source: "farmer",
      place: window.KD.NASHIK.name,
      severity: kdSeverity(confidence),
      ...partial,
    };
    reports.push(report);
    kdWriteReports(reports);
    return report;
  },

  setReportStatus: function setReportStatus(id, status) {
    const allowed = { pending: true, confirmed: true, rejected: true };
    if (!allowed[status]) return null;
    const reports = kdReadReports();
    const report = reports.find((item) => item.id === id);
    if (!report) return null;
    report.status = status;
    report.reviewedAt = kdNow();
    kdWriteReports(reports);
    return report;
  },

  stats: function stats() {
    const reports = kdReadReports();
    const count = (key, value) =>
      reports.filter((item) => item[key] === value).length;
    return {
      total: reports.length,
      pending: count("status", "pending"),
      confirmed: count("status", "confirmed"),
      rejected: count("status", "rejected"),
      severe: count("severity", "severe"),
      high: count("severity", "high"),
      moderate: count("severity", "moderate"),
    };
  },

  formatWhen: function formatWhen(ts) {
    if (!ts) return "";
    const delta = kdNow() - ts;
    const minutes = Math.round(delta / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return minutes + " min ago";
    const hours = Math.round(minutes / 60);
    if (hours < 24) return hours + " h ago";
    const days = Math.round(hours / 24);
    return days + " d ago";
  },

  pressure48: function pressure48(nowPct) {
    const field = window.KD.field || {};
    const days = field.dailyRisk || [];
    const today = days[0] ? days[0].score : 40;
    const later = days[2] ? days[2].score : days[1] ? days[1].score : today;
    const wet = field.wetHours >= 12 ? 4 : -6;
    const next = Math.round(nowPct + (later - today) * 0.55 + wet);
    return Math.max(4, Math.min(99, next));
  },
};

function kdMarkNav() {
  const path = (location.pathname || "/").replace(/\/+$/, "") || "/";
  const isFarmer = path === "/" || path.endsWith("/farmer");
  const isOfficer = path.endsWith("/officer");
  const isDashboard = path.endsWith("/dashboard");
  document.querySelectorAll("[data-route]").forEach((link) => {
    const route = link.getAttribute("data-route");
    const on =
      (route === "farmer" && isFarmer) ||
      (route === "officer" && isOfficer) ||
      (route === "dashboard" && isDashboard);
    link.classList.toggle("active", on);
    if (on) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

document.addEventListener("DOMContentLoaded", kdMarkNav);
