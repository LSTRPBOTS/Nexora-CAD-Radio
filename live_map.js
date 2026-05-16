// Initialize map (center near your demo coords; adjust as needed)
const map = L.map("map").setView([36.017, -86.515], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

const markers = {};

// Status → color mapping
function getColorByStatus(status) {
  switch (status) {
    case "AVAILABLE":
      return "green";      // available
    case "ENROUTE":
      return "yellow";     // enroute
    case "ON_SCENE":
      return "red";        // on scene
    case "PANIC":
      return "orange";     // panic
    case "BUSY":
      return "blue";       // busy / other
    default:
      return "gray";       // unknown
  }
}

function updateUnits(units) {
  units.forEach((unit) => {
    const { id, name, status, lat, lng } = unit;
    const color = getColorByStatus(status);

    if (markers[id]) {
      markers[id].setLatLng([lat, lng]);
      markers[id].setStyle({ color, fillColor: color });
      markers[id].bindPopup(`${name} (${status})`);
    } else {
      markers[id] = L.circleMarker([lat, lng], {
        radius: 8,
        color,
        fillColor: color,
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindPopup(`${name} (${status})`);
    }
  });
}

async function fetchUnits() {
  try {
    const res = await fetch("/erlc/units");
    const data = await res.json();
    if (data.success) {
      updateUnits(data.units);
    }
  } catch (e) {
    console.error("Failed to fetch units:", e);
  }
}

// Initial load + poll every 3 seconds
fetchUnits();
setInterval(fetchUnits, 3000);
