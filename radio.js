// EXPECTED: backend injects these before this script runs
// window.NEXORA_ACTIVE_USER = { name, callsign, departmentAbbr }
// window.NEXORA_ZONES = [ { id, name, locked, mode, channels:[...] }, ... ]

let zones = [];
let activeZone = null;
let activeChannel = null;
let activeFreq = null;
let activeMode = "ANALOG"; // "ANALOG" | "DMR" | "P25"

let identityEl, zoneSelect, channelSelect, modeBadge, freqDisplay, modeFields;
let freqInput, setFreqBtn, statusText, pttBtn;

let radioBus = new BroadcastChannel("nexora_radio");

let mediaStream = null;
let mediaRecorder = null;
let chunks = [];

// ---------- INIT ----------

window.addEventListener("load", () => {
  identityEl    = document.getElementById("identity");
  zoneSelect    = document.getElementById("zoneSelect");
  channelSelect = document.getElementById("channelSelect");
  modeBadge     = document.getElementById("modeBadge");
  freqDisplay   = document.getElementById("freqDisplay");
  modeFields    = document.getElementById("modeFields");
  freqInput     = document.getElementById("freqInput");
  setFreqBtn    = document.getElementById("setFreqBtn");
  statusText    = document.getElementById("statusText");
  pttBtn        = document.getElementById("ptt");

  const user = window.NEXORA_ACTIVE_USER || null;
  if (user) {
    identityEl.innerText = `${user.departmentAbbr} – ${user.callsign} – ${user.name}`;
  } else {
    identityEl.innerText = "NO USER (inject NEXORA_ACTIVE_USER)";
  }

  zones = Array.isArray(window.NEXORA_ZONES) ? window.NEXORA_ZONES : [];
  populateZones();

  zoneSelect.addEventListener("change", onZoneChange);
  channelSelect.addEventListener("change", onChannelChange);
  setFreqBtn.addEventListener("click", setCustomFrequency);

  pttBtn.addEventListener("mousedown", startTx);
  pttBtn.addEventListener("mouseup", stopTx);
  pttBtn.addEventListener("touchstart", (e) => { e.preventDefault(); startTx(); });
  pttBtn.addEventListener("touchend", (e) => { e.preventDefault(); stopTx(); });

  radioBus.onmessage = onRadioMessage;
});

// ---------- ZONES & CHANNELS ----------

function populateZones() {
  zoneSelect.innerHTML = "";
  zones.forEach((z, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${z.id} – ${z.name}`;
    zoneSelect.appendChild(opt);
  });

  if (zones.length > 0) {
    zoneSelect.value = 0;
    onZoneChange();
  } else {
    freqDisplay.innerText = "Freq: ---";
    modeFields.innerHTML = "";
  }
}

function onZoneChange() {
  const zIndex = parseInt(zoneSelect.value, 10);
  activeZone = zones[zIndex];

  channelSelect.innerHTML = "";
  if (!activeZone || !Array.isArray(activeZone.channels)) return;

  activeZone.channels.forEach((c, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = c.name;
    channelSelect.appendChild(opt);
  });

  if (activeZone.channels.length > 0) {
    channelSelect.value = 0;
    onChannelChange();
  }

  // lock / unlock frequency input
  freqInput.disabled = !!activeZone.locked;
}

function onChannelChange() {
  const cIndex = parseInt(channelSelect.value, 10);
  if (!activeZone || !activeZone.channels[cIndex]) return;

  activeChannel = activeZone.channels[cIndex];
  activeFreq    = activeChannel.freq;
  activeMode    = (activeZone.mode || "ANALOG").toUpperCase();

  freqDisplay.innerText = `Freq: ${activeFreq}`;
  updateModeBadge(activeMode);
  updateModeFields(activeMode, activeChannel);

  playChannelName(activeChannel.name);
}

// ---------- MODE UI ----------

function updateModeBadge(mode) {
  modeBadge.className = "";
  let label = "";

  if (mode === "ANALOG") {
    modeBadge.classList.add("mode-analog");
    label = "Analog (fuzzy)";
  } else if (mode === "DMR") {
    modeBadge.classList.add("mode-dmr");
    label = "DMR / MotoTRBO (digital)";
  } else if (mode === "P25") {
    modeBadge.classList.add("mode-p25");
    label = "P25 (clean)";
  } else {
    label = mode;
  }

  modeBadge.innerText = label;
}

function updateModeFields(mode, ch) {
  modeFields.innerHTML = "";

  if (mode === "ANALOG") {
    const pl = ch.pl || ch.ctcss || "---";
    const dpl = ch.dpl || ch.dcs || "---";
    modeFields.innerHTML = `
      <div>PL / CTCSS: ${pl}</div>
      <div>DPL / DCS: ${dpl}</div>
    `;
  } else if (mode === "DMR") {
    const cc   = ch.cc   ?? "---";
    const slot = ch.slot ?? "---";
    const tg   = ch.tg   ?? "---";
    modeFields.innerHTML = `
      <div>Color Code: ${cc}</div>
      <div>Time Slot: ${slot}</div>
      <div>Talkgroup: ${tg}</div>
    `;
  } else if (mode === "P25") {
    const nac = ch.nac ?? "---";
    const enc = ch.enc ? "ENABLED" : "OFF";
    modeFields.innerHTML = `
      <div>NAC: ${nac}</div>
      <div>Encryption: ${enc}</div>
    `;
  }
}

// ---------- CUSTOM FREQUENCY (UNLOCKED ZONES) ----------

function setCustomFrequency() {
  if (!activeZone || activeZone.locked) return;
  const val = freqInput.value.trim();
  if (!val) return;

  activeFreq = val;
  freqDisplay.innerText = `Freq: ${activeFreq}`;
}

// ---------- CHANNEL ANNOUNCEMENT ----------

function playChannelName(name) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(name);
  utter.rate = 1;
  utter.pitch = 1;
  utter.volume = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// ---------- PTT / AUDIO / CROSS-TAB ----------

async function ensureMic() {
  if (mediaStream) return;
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
}

async function startTx() {
  if (!activeFreq || !activeMode) return;

  try {
    await ensureMic();
  } catch (e) {
    statusText.innerText = "Mic blocked – allow microphone access.";
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

    // Local playback with mode profile
    playTxAudio(url, activeMode);

    // Broadcast to other tabs
    radioBus.postMessage({
      freq: activeFreq,
      mode: activeMode,
      url:  url
    });
  };

  mediaRecorder.start();
  statusText.innerText = `TX ${activeMode} @ ${activeFreq}`;
}

function stopTx() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    statusText.innerText = "Idle";
  }
}

function onRadioMessage(event) {
  const msg = event.data;
  if (!msg || !msg.freq || !msg.mode || !msg.url) return;

  // Only hear if freq + mode match
  if (msg.freq === activeFreq && msg.mode === activeMode) {
    playRxAudio(msg.url, msg.mode);
  }
}

// ---------- AUDIO PROFILES ----------

function playTxAudio(url, mode) {
  // For now, TX and RX use same profile; you can split later if you want
  playProfiledAudio(url, mode);
}

function playRxAudio(url, mode) {
  playProfiledAudio(url, mode);
}

function playProfiledAudio(url, mode) {
  const audio = new Audio(url);

  // Hooks for future processing:
  // - Analog: add noise / static
  // - DMR: add digital crunch / artifacts
  // - P25: keep clean

  // Basic example using Web Audio API (placeholder for your later tweaks)
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaElementSource(audio);
  const gain = ctx.createGain();
  const biquad = ctx.createBiquadFilter();

  if (mode === "ANALOG") {
    biquad.type = "lowpass";
    biquad.frequency.value = 3400;
    gain.gain.value = 1.0;
    // You can add a noise node here later for hiss/static
  } else if (mode === "DMR") {
    biquad.type = "bandpass";
    biquad.frequency.value = 2000;
    biquad.Q.value = 1.5;
    gain.gain.value = 1.0;
    // Later: add bitcrusher / distortion for digital crunch
  } else if (mode === "P25") {
    biquad.type = "highpass";
    biquad.frequency.value = 300;
    gain.gain.value = 1.0;
    // Keep it clean
  }

  src.connect(biquad);
  biquad.connect(gain);
  gain.connect(ctx.destination);

  audio.play();
}
