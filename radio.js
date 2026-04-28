// ---------- GLOBAL STATE ----------

let govZones = [];
let userZones = [];
let mergedZones = [];

let activeZone = null;
let activeChannel = null;
let activeFreq = null;
let activeMode = "ANALOG";

let radioBus = null;

let mediaStream = null;
let mediaRecorder = null;
let chunks = [];

let quickActive = false;

// ---------- SAFE TAB ID (CRITICAL FIX) ----------
if (!window.name) {
  window.name = "radio_" + Math.random().toString(36).slice(2);
}

// ---------- STORAGE KEYS ----------
const LS_USER_ZONES_KEY = "nexora_user_zones";
const LS_GOV_ZONES_KEY  = "nexora_gov_zones";
const LS_QUICK_TX       = "nexora_quick_tx";

// ---------- INIT BROADCAST ----------
try {
  radioBus = new BroadcastChannel("nexora_radio");
  console.log("[Radio] BroadcastChannel OK");
} catch (e) {
  console.error("[Radio] BroadcastChannel FAILED", e);
}

// ---------- INIT ----------
window.addEventListener("load", () => {

  const quickToggle = document.getElementById("quickToggle");
  const quickBtn    = document.getElementById("quickPTT");

  // Load quick TX state
  quickToggle.checked = localStorage.getItem(LS_QUICK_TX) === "true";
  updateQuickBtn();

  quickToggle.addEventListener("change", () => {
    localStorage.setItem(LS_QUICK_TX, quickToggle.checked);
    updateQuickBtn();
  });

  function updateQuickBtn() {
    quickBtn.style.display = quickToggle.checked ? "block" : "none";
  }

  // Quick TX toggle button
  quickBtn.addEventListener("click", async () => {
    if (!quickActive) {
      await startTx(document.getElementById("statusText"));
      quickActive = true;
      quickBtn.classList.add("active");
    } else {
      stopTx(document.getElementById("statusText"));
      quickActive = false;
      quickBtn.classList.remove("active");
    }
  });

  // Safety: stop TX if tab loses focus
  window.addEventListener("blur", () => {
    if (quickActive) {
      stopTx(document.getElementById("statusText"));
      quickActive = false;
      quickBtn.classList.remove("active");
    }
  });

  loadGovZones();
  loadUserZones();
  mergeZones();
  populateZones();
});

// ---------- RX HANDLER ----------
if (radioBus) {
  radioBus.onmessage = (event) => {
    const msg = event.data;
    if (!msg) return;

    if (msg.freq === activeFreq && msg.mode === activeMode) {
      playProfiledAudio(msg.url, msg.mode);
    }
  };
}

// ---------- MIC ----------
async function ensureMic() {
  if (mediaStream) return;
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
}

// ---------- TX ----------
async function startTx(statusText) {
  if (!activeFreq || !activeMode) return;

  if (mediaRecorder && mediaRecorder.state === "recording") return;

  try {
    await ensureMic();
  } catch {
    statusText.innerText = "Microphone blocked";
    return;
  }

  chunks = [];

  mediaRecorder = new MediaRecorder(mediaStream);

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);

    playProfiledAudio(url, activeMode);

    radioBus?.postMessage({
      freq: activeFreq,
      mode: activeMode,
      url: url,
      sender: window.name
    });
  };

  mediaRecorder.start();
  statusText.innerText = `TX ${activeMode} @ ${activeFreq}`;
}

// ---------- STOP TX ----------
function stopTx(statusText) {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    statusText.innerText = "Idle";
  }
}

// ---------- AUDIO ----------
function playProfiledAudio(url, mode) {
  const audio = new Audio(url);

  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaElementSource(audio);
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  if (mode === "ANALOG") {
    filter.type = "lowpass";
    filter.frequency.value = 3400;
  } 
  else if (mode === "DMR") {
    filter.type = "bandpass";
    filter.frequency.value = 2000;
  } 
  else if (mode === "P25") {
    filter.type = "highpass";
    filter.frequency.value = 300;
  }

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  audio.play().catch(() => {});
}

// ---------- LOAD ZONES ----------
function loadGovZones() {
  try {
    const raw = localStorage.getItem(LS_GOV_ZONES_KEY);
    govZones = raw ? JSON.parse(raw) : [];
  } catch {
    govZones = [];
  }
}

function loadUserZones() {
  try {
    const raw = localStorage.getItem(LS_USER_ZONES_KEY);
    userZones = raw ? JSON.parse(raw) : [];
  } catch {
    userZones = [];
  }
}

// ---------- MERGE ----------
function mergeZones() {
  const map = new Map();

  govZones.forEach(z => map.set(z.id, structuredClone(z)));

  userZones.forEach(z => {
    const existing = map.get(z.id);
    if (existing && existing.locked) return;
    map.set(z.id, structuredClone(z));
  });

  mergedZones = [...map.values()].sort((a,b) => a.id - b.id);
}

// ---------- POPULATE UI ----------
function populateZones() {
  const zoneSelect    = document.getElementById("zoneSelect");
  const channelSelect = document.getElementById("channelSelect");
  const freqDisplay   = document.getElementById("freqDisplay");
  const modeBadge     = document.getElementById("modeBadge");
  const modeFields    = document.getElementById("modeFields");

  zoneSelect.innerHTML = "";

  mergedZones.forEach(z => {
    const opt = document.createElement("option");
    opt.value = z.id;
    opt.textContent = `${z.id} – ${z.name}${z.locked ? " (LOCKED)" : ""}`;
    zoneSelect.appendChild(opt);
  });

  if (mergedZones.length > 0) {
    zoneSelect.value = mergedZones[0].id;

    onZoneChange(zoneSelect, channelSelect, freqDisplay, modeBadge, modeFields);

    // 🔥 AUTO-SELECT CHANNEL 1 ON LOAD
    setTimeout(() => {
      channelSelect.value = 0;
      onChannelChange(channelSelect, freqDisplay, modeBadge, modeFields);
    }, 0);
  }
}

// ---------- ZONE CHANGE ----------
function onZoneChange(zoneSelect, channelSelect, freqDisplay, modeBadge, modeFields) {
  const zId = parseInt(zoneSelect.value);

  activeZone = mergedZones.find(z => z.id === zId);

  channelSelect.innerHTML = "";

  activeZone.channels.forEach((c, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = c.name;
    channelSelect.appendChild(opt);
  });
}

// ---------- CHANNEL CHANGE ----------
function onChannelChange(channelSelect, freqDisplay, modeBadge, modeFields) {
  const idx = parseInt(channelSelect.value);

  activeChannel = activeZone.channels[idx];
  activeFreq = activeChannel.freq;
  activeMode = (activeZone.mode || "ANALOG").toUpperCase();

  freqDisplay.innerText = `Freq: ${activeFreq}`;
  modeBadge.innerText = activeMode;
}
