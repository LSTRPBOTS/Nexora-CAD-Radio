const user = JSON.parse(localStorage.getItem("currentUser"));
if (!user || user.role !== "Admin") window.location.href = "./index.html";

document.getElementById("userInfo").innerText =
  `Logged in as: ${user.name} (${user.badge})`;

let govOfficials = JSON.parse(localStorage.getItem("govOfficials")) || [];

function save() {
  localStorage.setItem("govOfficials", JSON.stringify(govOfficials));
  load();
}

function addGov() {
  const u = document.getElementById("govUser").value.trim();
  const p = document.getElementById("govPass").value.trim();
  const b = document.getElementById("govBadge").value.trim();

  if (!u || !p || !b) return alert("Fill all fields.");

  govOfficials.push({ username: u, password: p, badge: b });
  save();
}

function load() {
  const list = document.getElementById("govList");
  list.innerHTML = "";

  govOfficials.forEach(g => {
    const div = document.createElement("div");
    div.innerText = `${g.username} (${g.badge})`;
    list.appendChild(div);
  });
}

load();
