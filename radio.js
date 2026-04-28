// ---------- GLOBAL STATE ----------
if (!window.name) {
  window.name = "radio_" + Math.random().toString(36).slice(2);
}
let govZones = [];
let userZones = [];
let mergedZones = [];

let activeZone = null;
let activeChannel = null;
let activeFreq = null;
let activeMode = "ANALOG";

let radioBus;
try {
  radioBus = new BroadcastChannel("nexora_radio");
} catch {
  console.error("BroadcastChannel failed");
}

let mediaStream = null;
let mediaRecorder = null;
let chunks = [];

let quickActive = false;

// ---------- CONSTANTS ----------

const LS_USER_ZONES_KEY = "nexora_user_zones";
const LS_GOV_ZONES_KEY  = "nexora_gov_zones";
const LS_QUICK_TX       = "nexora_quick_tx";

const GOV_DEFAULT_ZONES = [
  {
    id: 1,
    name: "Zone 1 – GOV PRIMARY",
    locked: true,
    mode: "P25",
    channels: [
      {
        name: "GOV Dispatch",
        freq: "155.000",
        pl: "",
        nac: "293",
        cc: "",
        slot: "",
        tg: "",
        enc: false
      }
    ]
  }
];

// ---------- INIT ----------

window.addEventListener("load", () => {

  const quickToggle = document.getElementById("quickToggle");
  const quickBtn    = document.getElementById("quickPTT");

  // Load quick TX preference
  quickToggle.checked = localStorage.getItem(LS_QUICK_TX) === "true";
  updateQuickBtn();

  quickToggle.addEventListener("change", () => {
    localStorage.setItem(LS_QUICK_TX, quickToggle.checked);
    updateQuickBtn();
  });

  function updateQuickBtn() {
    quickBtn.style.display = quickToggle.checked ? "block" : "none";
  }

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

  window.addEventListener("blur", () => {
    if (quickActive) {
      stopTx(document.getElementById("statusText"));
      quickActive = false;
      quickBtn.classList.remove("active");
    }
  });

  // ----- EXISTING INIT -----

  loadGovZones();
  loadUserZones();
  mergeZones();
  populateZones();
});

// ---------- RX HANDLER (FIXED) ----------

if (radioBus) {
  radioBus.onmessage = (event) => {
    const msg = event.data;

    if (!msg || !msg.freq || !msg.mode || !msg.url) return;

    // Prevent hearing yourself
    if (msg.sender === window.name) return;

    if (msg.freq === activeFreq && msg.mode === activeMode) {
      playProfiledAudio(msg.url, msg.mode);
    }
  };
}

// ---------- TX (IMPROVED) ----------

async function ensureMic() {
  if (mediaStream) return;
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
}

async function startTx(statusText) {
  if (!activeFreq || !activeMode) return;

  if (mediaRecorder && mediaRecorder.state === "recording") return;

  try {
    await ensureMic();
  } catch {
    statusText.innerText = "Mic blocked";
    return;
  }

  chunks = [];

  mediaRecorder = new MediaRecorder(mediaStream);

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    const url  = URL.createObjectURL(blob);

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
  const biquad = ctx.createBiquadFilter();

  if (mode === "ANALOG") {
    biquad.type = "lowpass";
    biquad.frequency.value = 3400;
  } else if (mode === "DMR") {
    biquad.type = "bandpass";
    biquad.frequency.value = 2000;
  } else if (mode === "P25") {
    biquad.type = "highpass";
    biquad.frequency.value = 300;
  }

  src.connect(biquad);
  biquad.connect(gain);
  gain.connect(ctx.destination);

  audio.play().catch(() => {});
}
