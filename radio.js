// ---------- STATE ----------
let govZones = [];
let userZones = [];
let mergedZones = [];

let activeZone = null;
let activeChannel = null;
let activeFreq = null;
let activeMode = "ANALOG";

let radioBus = null;

// ---------- TAB ID FIX ----------
if (!window.name) {
  window.name = "radio_" + Math.random().toString(36).slice(2);
}

// ---------- BROADCAST ----------
try {
  radioBus = new BroadcastChannel("nexora_radio");
} catch {}

// ---------- STORAGE ----------
const LS_GOV = "nexora_gov_zones";
const LS_USER = "nexora_user_zones";

// ---------- INIT ----------
window.addEventListener("load", () => {

  loadGov();
  loadUser();
  merge();

  // 🔥 GUARANTEE ZONE 1 EXISTS
  if (!mergedZones.length) {
    mergedZones = [{
      id: 1,
      name: "Zone 1 (DEFAULT)",
      locked: true,
      mode: "P25",
      channels: [{
        name: "Channel 1",
        freq: "155.000"
      }]
    }];
  }

  initUI();
});

// ---------- UI INIT ----------
function initUI() {
  const zoneSelect = document.getElementById("zoneSelect");
  const channelSelect = document.getElementById("channelSelect");

  zoneSelect.innerHTML = "";

  mergedZones.forEach(z => {
    const opt = document.createElement("option");
    opt.value = z.id;
    opt.textContent = `${z.id} - ${z.name}`;
    zoneSelect.appendChild(opt);
  });

  zoneSelect.value = mergedZones[0].id;

  applyZone(mergedZones[0]);
}

// ---------- ZONE ----------
function applyZone(zone) {
  activeZone = zone;

  const zoneSelect = document.getElementById("zoneSelect");
  const channelSelect = document.getElementById("channelSelect");

  channelSelect.innerHTML = "";

  zone.channels.forEach((c, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = c.name;
    channelSelect.appendChild(opt);
  });

  channelSelect.value = 0;

  applyChannel(zone.channels[0]);

  zoneSelect.onchange = () => {
    const z = mergedZones.find(x => x.id == zoneSelect.value);
    applyZone(z);
  };

  channelSelect.onchange = () => {
    applyChannel(zone.channels[channelSelect.value]);
  };
}

// ---------- CHANNEL ----------
function applyChannel(ch) {
  if (!ch) return;

  activeChannel = ch;
  activeFreq = ch.freq;
  activeMode = "ANALOG";

  document.getElementById("freqDisplay").innerText = activeFreq;
  document.getElementById("modeBadge").innerText = activeMode;
}

// ---------- LOAD ----------
function loadGov() {
  try {
    govZones = JSON.parse(localStorage.getItem(LS_GOV)) || [];
  } catch {
    govZones = [];
  }
}

function loadUser() {
  try {
    userZones = JSON.parse(localStorage.getItem(LS_USER)) || [];
  } catch {
    userZones = [];
  }
}

// ---------- MERGE ----------
function merge() {
  mergedZones = [...govZones, ...userZones];
}
