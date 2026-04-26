// ---------------- GLOBAL STATE ----------------

let zones = [];
let activeZone = null;
let activeChannel = null;
let activeFreq = null;
let activeMode = "ANALOG"; // "ANALOG" | "DMR" | "P25"

let radioBus = new BroadcastChannel("nexora_radio");

let mediaStream = null;
let mediaRecorder = null;
let chunks = [];

// ---------------- INIT ----------------

window.addEventListener("load", () => {
  // Radio UI
  const zoneSelect    = document.getElementById("zoneSelect");
  const channelSelect = document.getElementById("channelSelect");
  const modeBadge     = document.getElementById("modeBadge");
  const freqDisplay   = document.getElementById("freqDisplay");
  const modeFields    = document.getElementById("modeFields");
  const freqInput     = document.getElementById("freqInput");
  const setFreqBtn    = document.getElementById("setFreqBtn");
  const pttBtn        = document.getElementById("ptt");
  const statusText    = document.getElementById("statusText");

  // Setup UI
  const setupWrapper     = document.getElementById("setupWrapper");
  const setupPanel       = document.getElementById("setupPanel");
  const setupToggleBtn   = document.getElementById("setupToggleBtn");
  const zoneCountInput   = document.getElementById("zoneCountInput");
  const zoneConfigArea   = document.getElementById("zoneConfigArea");
  const generateZonesBtn = document.getElementById("generateZonesBtn");
  const applySetupBtn    = document.getElementById("applySetupBtn");

  // Gov monitor
  const activeRadioCountEl = document.getElementById("activeRadioCount");
  const lastTxEl           = document.getElementById("lastTx");
  const lastFreqEl         = document.getElementById("lastFreq");
  const lastModeEl         = document.getElementById("lastMode");

  // ----- SETUP PANEL TOGGLE -----

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

  // ----- SETUP PANEL LOGIC -----

  generateZonesBtn.addEventListener("click", () => {
    const count = parseInt(zoneCountInput.value);
    if (!count || count < 1) return;

    zoneConfigArea.innerHTML = "";

    for (let i = 1; i <= count; i++) {
      const div = document.createElement("div");
      div.style.marginTop = "20px";

      const lockedLabel = (i === 1)
        ? "(LOCKED – Government Only)"
        : "(Unlocked)";

      div.innerHTML = `
        <h4>Zone ${i} ${lockedLabel}</h4>

        <label>Zone Name</label>
        <input id="zoneName_${i}" placeholder="e.g. RCPD PRIMARY">

        <label>Mode</label>
        <select id="zoneMode_${i}">
          <option value="ANALOG">Analog (fuzzy)</option>
          <option value="DMR">DMR / MotoTRBO (digital)</option>
          <option value="P25">P25 (clean)</option>
        </select>

        <label>Number of Channels</label>
        <input id="chanCount_${i}" type="number" min="1" placeholder="e.g. 1">

        <div id="chanArea_${i}"></div>

        <button type="button" onclick="generateChannelInputs(${i})">Create Channels</button>
      `;

      zoneConfigArea.appendChild(div);
    }
  });

  applySetupBtn.addEventListener("click", () => {
    zones = [];

    const zoneCount = parseInt(zoneCountInput.value);
    if (!zoneCount || zoneCount < 1) return;

    for (let z = 1; z <= zoneCount; z++) {
      const zoneNameEl = document.getElementById(`zoneName_${z}`);
      const zoneModeEl = document.getElementById(`zoneMode_${z}`);
      const chanCountEl = document.getElementById(`chanCount_${z}`);

      if (!zoneModeEl || !chanCountEl) continue;

      const chanCount = parseInt(chanCountEl.value) || 0;

      const zoneObj = {
        id: z,
        name: (zoneNameEl && zoneNameEl.value) || `Zone ${z}`,
        locked: (z === 1), // Zone 1 = government locked
        mode: zoneModeEl.value || "ANALOG",
        channels: []
      };

      for (let c = 1; c <= chanCount; c++) {
        const name = getVal(`chanName_${z}_${c}`);
        const freq = getVal(`chanFreq_${z}_${c}`);
        const pl   = getVal(`chanPL_${z}_${c}`);
        const nac  = getVal(`chanNAC_${z}_${c}`);
        const cc   = getVal(`chanCC_${z}_${c}`);
        const slot = getVal(`chanSlot_${z}_${c}`);
        const tg   = getVal(`chanTG_${z}_${c}`);
        const enc  = getVal(`chanENC_${z}_${c}`);

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

      zones.push(zoneObj);
    }

    populateZones();

    // Auto-collapse after apply (your B choice)
    setupCollapsed = true;
    setupPanel.style.display = "none";
    setupToggleBtn.textContent = "Expand";
    setupWrapper.style.width = "120px";
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

  // ----- RADIO UI LOGIC -----

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

  // ----- CROSS-TAB + GOV MONITOR -----

  radioBus.onmessage = (event) => {
    const msg = event.data;
    if (!msg || !msg.freq || !msg.mode || !msg.url) return;

    // Update monitor
    activeRadioCountEl.innerText = "1+";
    lastTxEl.innerText   = new Date().toLocaleTimeString();
    lastFreqEl.innerText = msg.freq;
    lastModeEl.innerText = msg.mode;

    // Only hear if freq + mode match
    if (msg.freq === activeFreq && msg.mode === activeMode) {
      playProfiledAudio(msg.url, msg.mode);
    }
  };

  // Initial empty state
  freqDisplay.innerText = "Freq: ---";
  modeFields.innerHTML = "";
});

// ---------------- RADIO HELPERS ----------------

function populateZones() {
  const zoneSelect    = document.getElementById("zoneSelect");
  const channelSelect = document.getElementById("channelSelect");
  const freqInput     = document.getElementById("freqInput");
  const freqDisplay   = document.getElementById("freqDisplay");
  const modeBadge     = document.getElementById("modeBadge");
  const modeFields    = document.getElementById("modeFields");

  zoneSelect.innerHTML = "";

  zones.forEach((z, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${z.id} – ${z.name}`;
    zoneSelect.appendChild(opt);
  });

  if (zones.length > 0) {
    zoneSelect.value = 0;
    onZoneChange(zoneSelect, channelSelect, freqInput, freqDisplay, modeBadge, modeFields);
  } else {
    freqDisplay.innerText = "Freq: ---";
    modeFields.innerHTML = "";
  }
}

function onZoneChange(zoneSelect, channelSelect, freqInput, freqDisplay, modeBadge, modeFields) {
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
    modeFields.innerHTML = `
      <div>PL / DPL: ${pl}</div>
    `;
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

// ---------------- PTT / AUDIO ----------------

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

    // Local playback
    playProfiledAudio(url, activeMode);

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
