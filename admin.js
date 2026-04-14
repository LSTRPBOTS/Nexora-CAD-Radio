// Load existing data
let officers = JSON.parse(localStorage.getItem("officers")) || {};
let dispatchers = JSON.parse(localStorage.getItem("dispatchers")) || {};

function save() {
  localStorage.setItem("officers", JSON.stringify(officers));
  localStorage.setItem("dispatchers", JSON.stringify(dispatchers));
  render();
}

// ===============================
// ADD OFFICER
// ===============================
function addOfficer() {
  const badge = document.getElementById("badge").value;
  const callsign = document.getElementById("callsign").value;
  const department = document.getElementById("department").value;
  const rank = document.getElementById("rank").value;

  if (!badge || !callsign || !department) return;

  officers[badge] = {
    callsign,
    department,
    rank
  };

  save();
}

// ===============================
// ADD DISPATCH MEMBER
// ===============================
function addDispatch() {
  const badge = document.getElementById("dBadge").value;
  const name = document.getElementById("dName").value;

  if (!badge || !name) return;

  dispatchers[badge] = {
    name,
    role: "dispatch"
  };

  save();
}

// ===============================
// RENDER LISTS
// ===============================
function render() {
  const oList = document.getElementById("officerList");
  const dList = document.getElementById("dispatchList");

  oList.innerHTML = "";
  dList.innerHTML = "";

  // Officers
  for (let b in officers) {
    const o = officers[b];
    oList.innerHTML += `
      <div>
        <b>${b}</b> — ${o.callsign} — ${o.department} — ${o.rank}
      </div>
    `;
  }

  // Dispatchers
  for (let b in dispatchers) {
    const d = dispatchers[b];
    dList.innerHTML += `
      <div>
        <b>${b}</b> — ${d.name}
      </div>
    `;
  }
}

render();