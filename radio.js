// ---------- GLOBAL STATE ----------

let govZones = [];   // from government.js (global)
let userZones = [];  // per-user (localStorage)
let mergedZones = []; // gov + user (gov wins on locked zones)

let activeZone = null;
let activeChannel = null;
let activeFreq = null;
let activeMode = "ANALOG";

let radioBus = new BroadcastChannel("nexora_radio");

let mediaStream = null;
let mediaRecorder = null;
let chunks = [];

// ---------- CONSTANTS / STORAGE KEYS ----------

const LS_USER_ZONES_KEY = "nexora_user_zones";
const LS_GOV_ZONES_KEY  = "nexora_gov_zones"; // government writes this
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
  const zoneSelect    = document.getElementById("zoneSelect");
  const channelSelect = document.getElementById("channelSelect");
  const modeBadge     = document.getElementById("modeBadge");
  const freqDisplay   = document.getElementById("freqDisplay");
  const modeFields    = document.getElementById("modeFields");
  const freqInput     = document.getElementById("freqInput");
  const setFreqBtn    = document.getElementById("setFreqBtn");
  const pttBtn        = document.getElementById("ptt");
  const statusText    = document.getElementById("statusText");

  const setupWrapper     = document.getElementById("setupWrapper");
  const setupPanel       = document.getElementById("setupPanel");
  const setupToggleBtn   = document.getElementById("setupToggleBtn");
  const zoneCountInput   = document.getElementById("zoneCountInput");
  const zoneConfigArea   = document.getElementById("zoneConfigArea");
  const generateZonesBtn = document.getElementById("generateZonesBtn");
  const applySetupBtn    = document.getElementById("applySetupBtn");
  const syncFromGovBtn   = document.getElementById("syncFromGovBtn");

  const activeRadioCountEl = document.getElementById("activeRadioCount");
  const lastTxEl           = document.getElementById("lastTx");
  const lastFreqEl         = document.getElementById("lastFreq");
  const lastModeEl         = document.getElementById("lastMode");

  // ----- Setup panel toggle -----
  let setupCollapsed = false;
  setupToggleBtn.addEventListener("click", () => {
    setupCollapsed = !setupCollapsed;
    if (setupCollapsed) {
      setupPanel.style.display = "none";
      setupToggleBtn.textContent = "Expand";
      setupWrapper.style.width = "120px";
    } else {
      setupPanel.style.display = "block";
      setupToggleBtn.textContent = "Collapse";
      setupWrapper.style.width = "340px";
    }
  });

  // ----- Load gov + user zones, merge, populate -----
  loadGovZones();
  loadUserZones();
  mergeZones();
  populateZones();

  // ----- User setup panel logic (Zones 2+) -----
  generateZonesBtn.addEventListener("click", () => {
    const count = parseInt(zoneCountInput.value);
    if (isNaN(count) || count < 0) return;

    zoneConfigArea.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const zoneId = 2 + i; // user zones start at 2
      const div = document.createElement("div");
      div.style.marginTop = "20px";

      div.innerHTML = `
        <h4>User Zone ${zoneId}</h4>

        <label>Zone Name</label>
        <input id="zoneName_${zoneId}" placeholder="e.g. RCPD TAC">

        <label>Mode</label>
        <select id="zoneMode_${zoneId}">
          <option value="ANALOG">Analog (fuzzy)</option>
          <option value="DMR">DMR / MotoTRBO (digital)</option>
          <option value="P25">P25 (clean)</option>
        </select>

        <label>Number of Channels</label>
        <input id="chanCount_${zoneId}" type="number" min="1" placeholder="e.g. 1">

        <div id="chanArea_${zoneId}"></div>

        <button type="button" onclick="generateChannelInputs(${zoneId})">Create Channels</button>
      `;

      zoneConfigArea.appendChild(div);
    }
  });

  applySetupBtn.addEventListener("click", () => {
    // Build userZones from panel (zones 2+)
    userZones = [];

    const inputs = zoneConfigArea.querySelectorAll("h4");
    inputs.forEach(h4 => {
      const text = h4.textContent || "";
      const match = text.match(/User Zone (\d+)/);
      if (!match) return;
      const zoneId = parseInt(match[1], 10);

      const zoneNameEl = document.getElementById(`zoneName_${zoneId}`);
      const zoneModeEl = document.getElementById(`zoneMode_${zoneId}`);
      const chanCountEl = document.getElementById(`chanCount_${zoneId}`);

      if (!zoneModeEl || !chanCountEl) return;

      const chanCount = parseInt(chanCountEl.value) || 0;

      const zoneObj = {
        id: zoneId,
        name: (zoneNameEl && zoneNameEl.value) || `Zone ${zoneId}`,
        locked: false,
        mode: zoneModeEl.value || "ANALOG",
        channels: []
      };

      for (let c = 1; c <= chanCount; c++) {
        const name = getVal(`chanName_${zoneId}_${c}`);
        const freq = getVal(`chanFreq_${zoneId}_${c}`);
        const pl   = getVal(`chanPL_${zoneId}_${c}`);
        const nac  = getVal(`chanNAC_${zoneId}_${c}`);
        const cc   = getVal(`chanCC_${zoneId}_${c}`);
        const slot = getVal(`chanSlot_${zoneId}_${c}`);
        const tg   = getVal(`chanTG_${zoneId}_${c}`);
        const enc  = getVal(`chanENC_${zoneId}_${c}`);

        zoneObj.channels.push({
          name: name || `Channel ${c}`,
          freq: freq || "000.000",
          pl,
          nac,
          cc,
          slot,
          tg,
          enc: enc === "true"
        });
      }

      userZones.push(zoneObj);
    });

    saveUserZones();
    mergeZones();
    populateZones();

    // Auto-collapse after apply
    setupCollapsed = true;
    setupPanel.style.display = "none";
    setupToggleBtn.textContent = "Expand";
    setupWrapper.style.width = "120px";
  });

  syncFromGovBtn.addEventListener("click", () => {
    loadGovZones();   // pull latest gov data
    mergeZones();     // merge with userZones
    populateZones();  // refresh UI
  });

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  // Expose channel generator globally for inline onclick
  window.generateChannelInputs = function(zoneId) {
    const chanCountEl = document.getElementById(`chanCount_${zoneId}`);
    const area = document.getElementById(`chanArea_${zoneId}`);
    if (!chanCountEl || !area) return;

    const count = parseInt(chanCountEl.value);
    if (!count || count < 1) return;

    area.innerHTML = "";

    for (let c = 1; c <= count; c++) {
      const div = document.createElement("div");
      div.style.marginTop = "10px";

      div.innerHTML = `
        <label>Channel ${c} Name</label>
        <input id="chanName_${zoneId}_${c}" placeholder="e.g. RCPD Dispatch">

        <label>Frequency</label>
        <input id="chanFreq_${zoneId}_${c}" placeholder="Any frequency string">

        <label>Analog PL/DPL</label>
        <input id="chanPL_${zoneId}_${c}" placeholder="e.g. 192.8 or D023">

        <label>P25 NAC</label>
        <input id="chanNAC_${zoneId}_${c}" placeholder="e.g. 293">

        <label>DMR Color Code</label>
        <input id="chanCC_${zoneId}_${c}" placeholder="e.g. 1">

        <label>DMR Slot</label>
        <input id="chanSlot_${zoneId}_${c}" placeholder="1 or 2">

        <label>DMR Talkgroup</label>
        <input id="chanTG_${zoneId}_${c}" placeholder="e.g. 1001">

        <label>Encryption</label>
        <select id="chanENC_${zoneId}_${c}">
          <option value="false">Off</option>
          <option value="true">On</option>
        </select>
      `;

      area.appendChild(div);
    }
  };

  // ----- Radio UI logic -----
  zoneSelect.addEventListener("change", () =>
    onZoneChange(zoneSelect, channelSelect, freqInput, freqDisplay, modeBadge, modeFields)
  );
  channelSelect.addEventListener("change", () =>
    onChannelChange(channelSelect, freqDisplay, modeBadge, modeFields)
  );

  setFreqBtn.addEventListener("click", () => {
    if (!activeZone || activeZone.locked) return;
    const val = freqInput.value.trim();
    if (!val) return;
    activeFreq = val;
    freqDisplay.innerText = `Freq: ${activeFreq}`;
  });

  pttBtn.addEventListener("mousedown", () => startTx(statusText));
  pttBtn.addEventListener("mouseup",   () => stopTx(statusText));
  pttBtn.addEventListener("mouseleave", () => stopTx(statusText));
  pttBtn.addEventListener("touchstart", (e) => { e.preventDefault(); startTx(statusText); });
  pttBtn.addEventListener("touchend",   (e) => { e.preventDefault(); stopTx(statusText); });

  // ----- Cross-tab + gov monitor -----
  radioBus.onmessage = (event) => {
    const msg = event.data;
    if (!msg || !msg.freq || !msg.mode || !msg.url) return;

    activeRadioCountEl.innerText = "1+";
    lastTxEl.innerText   = new Date().toLocaleTimeString();
    lastFreqEl.innerText = msg.freq;
    lastModeEl.innerText = msg.mode;

    if (msg.freq === activeFreq && msg.mode === activeMode) {
      playProfiledAudio(msg.url, msg.mode);
    }
  };

  freqDisplay.innerText = "Freq: ---";
  modeFields.innerHTML = "";
});

// ---------- GOV / USER LOAD & MERGE ----------

function loadGovZones() {
  try {
    const raw = localStorage.getItem(LS_GOV_ZONES_KEY);
    if (raw) {
      govZones = JSON.parse(raw);
    } else {
      govZones = GOV_DEFAULT_ZONES;
      localStorage.setItem(LS_GOV_ZONES_KEY, JSON.stringify(govZones));
    }
  } catch {
    govZones = GOV_DEFAULT_ZONES;
  }
}

function loadUserZones() {
  try {
    const raw = localStorage.getItem(LS_USER_ZONES_KEY);
    if (raw) {
      userZones = JSON.parse(raw);
    } else {
      userZones = [];
    }
  } catch {
    userZones = [];
  }
}

function saveUserZones() {
  localStorage.setItem(LS_USER_ZONES_KEY, JSON.stringify(userZones));
}

function mergeZones() {
  // govZones first (Zone 1 locked, plus any others gov created)
  const map = new Map();
  govZones.forEach(z => {
    map.set(z.id, JSON.parse(JSON.stringify(z)));
  });

  // userZones next (only for zones not locked by gov)
  userZones.forEach(z => {
    const existing = map.get(z.id);
    if (existing && existing.locked) {
      // gov wins
      return;
    }
    map.set(z.id, JSON.parse(JSON.stringify(z)));
  });

  mergedZones = Array.from(map.values()).sort((a, b) => a.id - b.id);
}

// ---------- RADIO HELPERS ----------

function populateZones() {
  const zoneSelect    = document.getElementById("zoneSelect");
  const channelSelect = document.getElementById("channelSelect");
  const freqInput     = document.getElementById("freqInput");
  const freqDisplay   = document.getElementById("freqDisplay");
  const modeBadge     = document.getElementById("modeBadge");
  const modeFields    = document.getElementById("modeFields");

  zoneSelect.innerHTML = "";

  mergedZones.forEach((z) => {
    const opt = document.createElement("option");
    opt.value = z.id;
    opt.textContent = `${z.id} – ${z.name}${z.locked ? " (LOCKED)" : ""}`;
    zoneSelect.appendChild(opt);
  });

  if (mergedZones.length > 0) {
    zoneSelect.value = mergedZones[0].id;
    onZoneChange(zoneSelect, channelSelect, freqInput, freqDisplay, modeBadge, modeFields);
  } else {
    freqDisplay.innerText = "Freq: ---";
    modeFields.innerHTML = "";
  }
}

function onZoneChange(zoneSelect, channelSelect, freqInput, freqDisplay, modeBadge, modeFields) {
  const zId = parseInt(zoneSelect.value, 10);
  activeZone = mergedZones.find(z => z.id === zId);

  channelSelect.innerHTML = "";
  if (!activeZone || !Array.isArray(activeZone.channels)) return;

  activeZone.channels.forEach((c, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = c.name;
    channelSelect.appendChild(opt);
  });

  freqInput.disabled = !!activeZone.locked;

  if (activeZone.channels.length > 0) {
    channelSelect.value = 0;
    onChannelChange(channelSelect, freqDisplay, modeBadge, modeFields);
  }
}

function onChannelChange(channelSelect, freqDisplay, modeBadge, modeFields) {
  const cIndex = parseInt(channelSelect.value, 10);
  if (!activeZone || !activeZone.channels[cIndex]) return;

  activeChannel = activeZone.channels[cIndex];
  activeFreq    = activeChannel.freq;
  activeMode    = (activeZone.mode || "ANALOG").toUpperCase();

  freqDisplay.innerText = `Freq: ${activeFreq}`;
  updateModeBadge(activeMode, modeBadge);
  updateModeFields(activeMode, activeChannel, modeFields);

  playChannelName(activeChannel.name);
}

function updateModeBadge(mode, modeBadge) {
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

function updateModeFields(mode, ch, modeFields) {
  modeFields.innerHTML = "";

  if (mode === "ANALOG") {
    const pl  = ch.pl  || "---";
    modeFields.innerHTML = `<div>PL / DPL: ${pl}</div>`;
  } else if (mode === "DMR") {
    const cc   = ch.cc   || "---";
    const slot = ch.slot || "---";
    const tg   = ch.tg   || "---";
    modeFields.innerHTML = `
      <div>Color Code: ${cc}</div>
      <div>Time Slot: ${slot}</div>
      <div>Talkgroup: ${tg}</div>
    `;
  } else if (mode === "P25") {
    const nac = ch.nac || "---";
    const enc = ch.enc ? "ENABLED" : "OFF";
    modeFields.innerHTML = `
      <div>NAC: ${nac}</div>
      <div>Encryption: ${enc}</div>
    `;
  }
}

function playChannelName(name) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(name);
  utter.rate = 1;
  utter.pitch = 1;
  utter.volume = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// ---------- PTT / AUDIO ----------

async function ensureMic() {
  if (mediaStream) return;
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
}

async function startTx(statusText) {
  if (!activeFreq || !activeMode) return;

  try {
    await ensureMic();
  } catch {
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

    playProfiledAudio(url, activeMode);

    radioBus.postMessage({
      freq: activeFreq,
      mode: activeMode,
      url:  url
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

function playProfiledAudio(url, mode) {
  const audio = new Audio(url);
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaElementSource(audio);
  const gain = ctx.createGain();
  const biquad = ctx.createBiquadFilter();

  if (mode === "ANALOG") {
    biquad.type = "lowpass";
    biquad.frequency.value = 3400;
    gain.gain.value = 1.0;
  } else if (mode === "DMR") {
    biquad.type = "bandpass";
    biquad.frequency.value = 2000;
    biquad.Q.value = 1.5;
    gain.gain.value = 1.0;
  } else if (mode === "P25") {
    biquad.type = "highpass";
    biquad.frequency.value = 300;
    gain.gain.value = 1.0;
  }

  src.connect(biquad);
  biquad.connect(gain);
  gain.connect(ctx.destination);

  audio.play();
}
