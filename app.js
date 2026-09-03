const MODEL_URL = "model.json";
const LABELS_URL = "labels.txt";

let ADVISORIES = {};

const statusEl = document.getElementById("status");
const previewEl = document.getElementById("preview");
const placeholderEl = document.getElementById("placeholder");
const uploadBtn = document.getElementById("uploadBtn");
const cameraBtn = document.getElementById("cameraBtn");
const fileInput = document.getElementById("fileInput");
const cameraInput = document.getElementById("cameraInput");
const cameraPanel = document.getElementById("cameraPanel");
const cameraVideo = document.getElementById("cameraVideo");
const snapBtn = document.getElementById("snapBtn");
const closeCameraBtn = document.getElementById("closeCameraBtn");
const resultEl = document.getElementById("result");
const labelEl = document.getElementById("label");
const confidenceEl = document.getElementById("confidence");
const retryEl = document.getElementById("retry");
const advisoryEl = document.getElementById("advisory");
const advNameEl = document.getElementById("advName");
const advActionEl = document.getElementById("advAction");
const advWaitEl = document.getElementById("advWait");
const ipmCardsEl = document.getElementById("ipmCards");
const sendOfficerBtn = document.getElementById("sendOfficerBtn");
const reportNoteEl = document.getElementById("reportNote");
const heroEl = document.getElementById("hero");
const heroKickerEl = document.getElementById("heroKicker");
const heroTitleEl = document.getElementById("heroTitle");
const heroNowEl = document.getElementById("heroNow");
const hero48El = document.getElementById("hero48");
const weekBarEl = document.getElementById("weekBar");
const weekDaysEl = document.getElementById("weekDays");
const advMarathiEl = document.getElementById("advMarathi");
const reviewBtn = document.getElementById("reviewBtn");

let model = null;
let labels = [];
let inputHeight = 224;
let inputWidth = 224;
let cameraStream = null;
let lastResult = null;

function setStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", Boolean(isError));
}

function parseLabels(text) {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\d+\s+(.+)$/);
      return match ? match[1].trim() : line;
    });
}

function prettyLabel(id) {
  return id.replace(/___+/g, " ").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function softmax(values) {
  const max = Math.max.apply(null, values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

function toProbabilities(values) {
  const sum = values.reduce((a, b) => a + b, 0);
  const looksLikeProbs =
    values.every((v) => v >= 0 && v <= 1.01) && Math.abs(sum - 1) < 0.08;
  return looksLikeProbs ? values : softmax(values);
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  cameraVideo.srcObject = null;
  cameraPanel.hidden = true;
}

function showPreview(url) {
  previewEl.src = url;
  previewEl.hidden = false;
  placeholderEl.hidden = true;
}

function sourceToTensor(source) {
  const canvas = document.createElement("canvas");
  canvas.width = inputWidth;
  canvas.height = inputHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const sw = source.videoWidth || source.naturalWidth || source.width;
  const sh = source.videoHeight || source.naturalHeight || source.height;
  const scale = Math.max(inputWidth / sw, inputHeight / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(source, (inputWidth - dw) / 2, (inputHeight - dh) / 2, dw, dh);
  return tf.tidy(() =>
    tf.browser.fromPixels(canvas).toFloat().div(127.5).sub(1).expandDims(0)
  );
}

function renderIpmCards(cards) {
  if (!ipmCardsEl) return;
  ipmCardsEl.innerHTML = "";
  (cards || []).forEach((card) => {
    const art = document.createElement("article");
    art.className = "ipm-card";
    const title = document.createElement("h3");
    title.textContent = card.title || "";
    const text = document.createElement("p");
    text.textContent = card.text || "";
    art.appendChild(title);
    art.appendChild(text);
    ipmCardsEl.appendChild(art);
  });
}

function riskFromScore(score) {
  if (score >= 75) return "severe";
  if (score >= 55) return "high";
  if (score >= 35) return "moderate";
  return "low";
}

function paintWeekBar(nowPct) {
  if (!weekBarEl) return;
  const base = typeof nowPct === "number" ? nowPct : 50;
  const days =
    window.KD && KD.field && KD.field.dailyRisk && KD.field.dailyRisk.length
      ? KD.field.dailyRisk
      : [0, 1, 2, 3, 4, 5, 6].map(function (_n, i) {
          const labels = ["S", "M", "T", "W", "T", "F", "S"];
          return { level: "low", label: labels[i], score: 20 };
        });
  const curve = [1, 0.97, 0.9, 0.82, 0.74, 0.68, 0.62];
  weekBarEl.innerHTML = "";
  if (weekDaysEl) weekDaysEl.innerHTML = "";
  days.forEach(function (day, i) {
    const mixed = Math.round(base * (curve[i] || 0.6) + (day.score || 0) * 0.18);
    const bar = document.createElement("span");
    bar.className = riskFromScore(mixed);
    weekBarEl.appendChild(bar);
    if (weekDaysEl) {
      const lab = document.createElement("span");
      lab.textContent = day.label || "";
      weekDaysEl.appendChild(lab);
    }
  });
}

function showResult(labelId, confidence) {
  const percent = Math.round(confidence * 100);
  resultEl.hidden = false;
  labelEl.textContent = prettyLabel(labelId);
  confidenceEl.textContent = percent + "% confidence";

  const isBadPhoto = labelId === "bad_photo";
  retryEl.hidden = !isBadPhoto;

  const advice = ADVISORIES[labelId];
  const isHealthy = /healthy/i.test(labelId);

  if (heroEl) {
    heroEl.hidden = isBadPhoto;
    const name = (advice && advice.name) || prettyLabel(labelId);
    const verb = percent >= 70 ? "peaks at" : "holds at";
    if (heroKickerEl) heroKickerEl.textContent = name;
    if (heroTitleEl) {
      heroTitleEl.textContent = isHealthy
        ? "No outbreak pressure at " + percent + "%"
        : "Pressure " + verb + " " + percent + "%";
    }
    if (heroNowEl) heroNowEl.textContent = percent + "%";
    if (hero48El) {
      hero48El.textContent =
        (window.KD ? KD.pressure48(percent) : percent) + "%";
    }
    paintWeekBar(percent);
  }

  if (advice) {
    advisoryEl.hidden = false;
    advNameEl.textContent = advice.name;
    advActionEl.textContent = advice.firstAction;
    advWaitEl.textContent = String(advice.waitDays);
    if (advMarathiEl) advMarathiEl.textContent = advice.marathi || "";
    renderIpmCards(advice.cards);
    if (ipmCardsEl) ipmCardsEl.hidden = true;
  } else {
    advisoryEl.hidden = true;
    renderIpmCards([]);
  }

  lastResult = { labelId, confidence, label: prettyLabel(labelId) };
  const canSend = !isBadPhoto && window.KD;
  if (sendOfficerBtn) sendOfficerBtn.hidden = true;
  if (reviewBtn) reviewBtn.hidden = !canSend || !advice;
  if (reportNoteEl) {
    reportNoteEl.hidden = true;
    reportNoteEl.textContent = "";
  }
}

async function classifySource(source) {
  if (!model) {
    setStatus("Model is still loading.", true);
    return;
  }
  setStatus("Checking photo…");
  const input = sourceToTensor(source);
  try {
    const output = model.predict(input);
    const tensor = Array.isArray(output) ? output[0] : output;
    const values = Array.from(await tensor.data());
    tf.dispose(output);
    const probs = toProbabilities(values);
    let best = 0;
    for (let i = 1; i < probs.length; i += 1) {
      if (probs[i] > probs[best]) best = i;
    }
    const labelId = labels[best] || "class_" + best;
    showResult(labelId, probs[best]);
    setStatus("Done");
  } catch (err) {
    console.error(err);
    setStatus("Could not read this photo. Try another.", true);
  } finally {
    tf.dispose(input);
  }
}

async function handleFile(file) {
  if (!file) return;
  stopCamera();
  let bitmap = null;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (err) {
    bitmap = await createImageBitmap(file);
  }
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0);
  showPreview(canvas.toDataURL("image/jpeg", 0.9));
  await classifySource(bitmap);
  bitmap.close();
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    cameraInput.click();
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    cameraVideo.srcObject = cameraStream;
    await cameraVideo.play();
    previewEl.hidden = true;
    placeholderEl.hidden = true;
    cameraPanel.hidden = false;
    resultEl.hidden = true;
    setStatus("Point at a leaf, then capture.");
  } catch (err) {
    console.error(err);
    cameraInput.click();
  }
}

async function loadApp() {
  try {
    await tf.ready();
    const labelsText = await fetch(LABELS_URL).then((res) => {
      if (!res.ok) throw new Error("labels.txt missing");
      return res.text();
    });
    labels = parseLabels(labelsText);
    try {
      const adviceRes = await fetch("advice.json");
      if (adviceRes.ok) ADVISORIES = await adviceRes.json();
    } catch (adviceErr) {
      console.error(adviceErr);
    }
    model = await tf.loadLayersModel(MODEL_URL);
    const shape = model.inputs && model.inputs[0] && model.inputs[0].shape;
    if (shape && shape.length >= 3) {
      inputHeight = shape[1] > 0 ? shape[1] : 224;
      inputWidth = shape[2] > 0 ? shape[2] : 224;
    }
    uploadBtn.disabled = false;
    cameraBtn.disabled = false;
    setStatus("Ready. Upload a photo or use the camera.");
  } catch (err) {
    console.error(err);
    setStatus(
      "Could not load model.json. Open this folder with a local web server.",
      true
    );
  }
}

uploadBtn.addEventListener("click", () => fileInput.click());
cameraBtn.addEventListener("click", () => startCamera());
fileInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  handleFile(file);
  fileInput.value = "";
});
cameraInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  handleFile(file);
  cameraInput.value = "";
});
snapBtn.addEventListener("click", async () => {
  const snap = document.createElement("canvas");
  snap.width = cameraVideo.videoWidth || 640;
  snap.height = cameraVideo.videoHeight || 480;
  snap.getContext("2d").drawImage(cameraVideo, 0, 0);
  showPreview(snap.toDataURL("image/jpeg", 0.9));
  stopCamera();
  await classifySource(snap);
});
closeCameraBtn.addEventListener("click", () => {
  stopCamera();
  if (previewEl.src) {
    previewEl.hidden = false;
    placeholderEl.hidden = true;
  } else {
    placeholderEl.hidden = false;
  }
  setStatus("Ready. Upload a photo or use the camera.");
});

function queueLastResult() {
  if (!lastResult || !window.KD) return;
  KD.seedIfEmpty();
  KD.addReport({
    labelId: lastResult.labelId,
    label: lastResult.label,
    confidence: lastResult.confidence,
    place: KD.NASHIK.name,
    lat: KD.NASHIK.lat,
    lng: KD.NASHIK.lng,
    status: "pending",
  });
  if (sendOfficerBtn) sendOfficerBtn.hidden = true;
  if (reviewBtn) reviewBtn.hidden = true;
  if (ipmCardsEl) ipmCardsEl.hidden = false;
  if (reportNoteEl) {
    reportNoteEl.hidden = false;
    reportNoteEl.textContent = "Queued for officer review.";
  }
}

if (sendOfficerBtn) {
  sendOfficerBtn.addEventListener("click", queueLastResult);
}

if (reviewBtn) {
  reviewBtn.addEventListener("click", queueLastResult);
}

window.addEventListener("kd-weather", function () {
  if (!lastResult || !heroEl || heroEl.hidden) return;
  const percent = Math.round(lastResult.confidence * 100);
  if (hero48El) hero48El.textContent = KD.pressure48(percent) + "%";
  paintWeekBar(percent);
});

if (/[?&]demo=1(?:&|$)/.test(location.search)) {
  fetch("advice.json")
    .then(function (res) {
      return res.ok ? res.json() : {};
    })
    .then(function (json) {
      ADVISORIES = json;
      showResult("grape_black_rot", 0.88);
    })
    .catch(function () {
      showResult("grape_black_rot", 0.88);
    });
}

loadApp();
