const user = JSON.parse(localStorage.getItem("currentUser"));
if (!user || user.role !== "Government") window.location.href = "./index.html";

document.getElementById("userInfo").innerText =
  `Logged in as: ${user.name} (${user.badge})`;

let departments = JSON.parse(localStorage.getItem("departments")) || {};

function save() {
  localStorage.setItem("departments", JSON.stringify(departments));
  loadDepartments();
}

function addDepartment() {
  const name = document.getElementById("deptName").value.trim();
  const abbr = document.getElementById("deptAbbr").value.trim();

  if (!name || !abbr) return alert("Enter name + abbreviation.");

  departments[abbr] = { name, units: [] };
  save();
}

function addUnit() {
  const abbr = document.getElementById("deptSelect").value;
  const unit = document.getElementById("unitName").value.trim();

  if (!unit) return alert("Enter a unit name.");

  departments[abbr].units.push(unit);
  save();
}

function loadDepartments() {
  const deptSelect = document.getElementById("deptSelect");
  const deptList = document.getElementById("deptList");

  deptSelect.innerHTML = "";
  deptList.innerHTML = "";

  for (const abbr in departments) {
    const dept = departments[abbr];

    const opt = document.createElement("option");
    opt.value = abbr;
    opt.innerText = `${abbr} — ${dept.name}`;
    deptSelect.appendChild(opt);

    const div = document.createElement("div");
    div.innerHTML = `<b>${abbr}</b>: ${dept.name}<br>Units: ${dept.units.join(", ")}`;
    deptList.appendChild(div);
  }
}

loadDepartments();
