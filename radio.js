// ---------- STATE ----------
let govZones = [];
let userZones = [];
let mergedZones = [];

let activeZone = null;
let activeChannel = null;
let activeFreq = null;
let activeMode = "ANALOG";

// ---------- TAB ID & BROADCAST ----------
if (!window.name) window.name = "radio_" + Math.random().toString(36).slice(2);
const radioBus = new BroadcastChannel("nexora_radio");

// ---------- CONSTANTS ----------
const LS_GOV = "nexora_gov_zones";
const LS_USER = "nexora_user_zones";

// ---------- INIT ON LOAD ----------
window.addEventListener("load", () => {
  setupEventListeners();
  refreshRadioData();
});

function refreshRadioData() {
  loadGov();
  loadUser();
  merge();

  // 🔥 GUARANTEE DATA EXISTS
  if (mergedZones.length === 0) {
    mergedZones = [{
      id: 1,
      name: "Zone 1 (DEFAULT)",
      locked: true,
      channels: [{ name: "Channel 1", freq: "155.000", mode: "ANALOG" }]
    }];
  }

  populateZoneDropdown();
}

function setupEventListeners() {
  const zoneSelect = document.getElementById("zoneSelect");
  const channelSelect = document.getElementById("channelSelect");

  // Zone Change logic
  zoneSelect.addEventListener("change", () => {
    const selectedZone = mergedZones.find(z => z.id == zoneSelect.value);
    if (selectedZone) applyZone(selectedZone);
  });

  // Channel Change logic
  channelSelect.addEventListener("change", () => {
    if (activeZone && activeZone.channels[channelSelect.value]) {
      applyChannel(activeZone.channels[channelSelect.value]);
    }
  });

  // PTT logic (Example)
  document.getElementById("ptt").onmousedown = () => updateStatus("TRANSMITTING...");
  document.getElementById("ptt").onmouseup = () => updateStatus("Idle");
}

function populateZoneDropdown() {
  const zoneSelect = document.getElementById("zoneSelect");
  zoneSelect.innerHTML = "";

  mergedZones.forEach(z => {
    const opt = document.createElement("option");
    opt.value = z.id;
    opt.textContent = `${z.id} - ${z.name}`;
    zoneSelect.appendChild(opt);
  });

  // Force first zone
  zoneSelect.value = mergedZones[0].id;
  applyZone(mergedZones[0]);
}

function applyZone(zone) {
  activeZone = zone;
  const channelSelect = document.getElementById("channelSelect");
  channelSelect.innerHTML = "";

  zone.channels.forEach((ch, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = ch.name;
    channelSelect.appendChild(opt);
  });

  // Default to first channel in zone
  channelSelect.value = 0;
  applyChannel(zone.channels[0]);
}

function applyChannel(ch) {
  if (!ch) return;

  activeChannel = ch;
  activeFreq = ch.freq;
  activeMode = ch.mode || "ANALOG";

  document.getElementById("freqDisplay").innerText = `Freq: ${activeFreq}`;
  document.getElementById("modeBadge").innerText = activeMode;
}

function updateStatus(msg) {
  document.getElementById("statusText").innerText = `Status: ${msg}`;
}

// ---------- DATA LOADING ----------
function loadGov() {
  try {
    govZones = JSON.parse(localStorage.getItem(LS_GOV)) || [];
  } catch { govZones = []; }
}

function loadUser() {
  try {
    userZones = JSON.parse(localStorage.getItem(LS_USER)) || [];
  } catch { userZones = []; }
}

function merge() {
  mergedZones = [...govZones, ...userZones];
}
