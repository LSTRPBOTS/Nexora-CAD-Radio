// ---------- STATE ----------
let govZones = [];
let userZones = [];
let mergedZones = [];

let activeZone = null;
let activeChannel = null;
let activeFreq = null;
let activeMode = "ANALOG";

const LS_GOV = "nexora_gov_zones";
const LS_USER = "nexora_user_zones";

// ---------- INIT ----------
window.addEventListener("load", () => {
  initRadio();
});

function initRadio() {
  // 1. Load Data
  try {
    govZones = JSON.parse(localStorage.getItem(LS_GOV)) || [];
    userZones = JSON.parse(localStorage.getItem(LS_USER)) || [];
  } catch (e) {
    console.error("Storage error", e);
  }

  // 2. Merge
  mergedZones = [...govZones, ...userZones];

  // 3. 🔥 THE "ANTI-FUCKUP" FAILSAFE
  // If nothing exists, force Zone 1 so the UI can't crash
  if (mergedZones.length === 0) {
    mergedZones = [{
      id: 1,
      name: "Zone 1 (DEFAULT)",
      channels: [{ name: "Channel 1", freq: "155.000", mode: "ANALOG" }]
    }];
  }

  // 4. Setup UI Elements
  const zoneSelect = document.getElementById("zoneSelect");
  const channelSelect = document.getElementById("channelSelect");

  // Clear and Populate Zones
  zoneSelect.innerHTML = "";
  mergedZones.forEach(z => {
    const opt = document.createElement("option");
    opt.value = z.id;
    opt.textContent = `${z.id} - ${z.name}`;
    zoneSelect.appendChild(opt);
  });

  // 5. ATTACH LISTENERS ONCE
  zoneSelect.onchange = () => {
    const target = mergedZones.find(x => x.id == zoneSelect.value);
    if (target) updateZoneUI(target);
  };

  channelSelect.onchange = () => {
    if (activeZone && activeZone.channels[channelSelect.value]) {
      updateChannelUI(activeZone.channels[channelSelect.value]);
    }
  };

  // 6. KICKSTART BOOT SEQUENCE
  updateZoneUI(mergedZones[0]);
}

// ---------- UI UPDATE LOGIC ----------

function updateZoneUI(zone) {
  activeZone = zone;
  const channelSelect = document.getElementById("channelSelect");
  
  // Repopulate Channels for this zone
  channelSelect.innerHTML = "";
  zone.channels.forEach((c, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = c.name;
    channelSelect.appendChild(opt);
  });

  // Default to first channel
  channelSelect.value = 0;
  updateChannelUI(zone.channels[0]);
}

function updateChannelUI(ch) {
  if (!ch) return;

  activeChannel = ch;
  activeFreq = ch.freq;
  activeMode = ch.mode || "ANALOG";

  // Update Visuals
  document.getElementById("freqDisplay").innerText = activeFreq;
  document.getElementById("modeBadge").innerText = activeMode;
}

// ---------- PTT LOGIC ----------
const ptt = document.getElementById("ptt");
ptt.onmousedown = () => { document.getElementById("statusText").innerText = "TX..."; ptt.style.color = "red"; };
ptt.onmouseup = () => { document.getElementById("statusText").innerText = "IDLE"; ptt.style.color = "#0f0"; };
