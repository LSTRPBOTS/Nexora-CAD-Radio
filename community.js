function loadCurrentSession() {
  const box = document.getElementById("currentSessionBox");
  const currentCommunity = localStorage.getItem("currentCommunity");
  const username = localStorage.getItem("username");
  const idNumber = localStorage.getItem("idNumber");
  const isMaster = localStorage.getItem("isMasterLogin") === "true";

  if (!currentCommunity) {
    box.innerHTML = `
      <p>No community selected yet.</p>
      <p>Join a public community or enter a custom ID.</p>
    `;
    return;
  }

  box.innerHTML = `
    <p><strong>Community:</strong> ${currentCommunity}</p>
    <p><strong>User:</strong> ${username} (#${idNumber})</p>
    <p><strong>Master:</strong> ${isMaster ? "YES" : "NO"}</p>
    <button onclick="goToDashboard()">Go to CAD Dashboard</button>
  `;
}

// JOIN PUBLIC COMMUNITY (ADMIN or GLOBAL-RP)
function joinPublicCommunity(name) {
  const username = prompt("Enter your username:");
  if (!username) return;

  const idNumber = prompt("Enter your ID number:");
  if (!idNumber) return;

  localStorage.setItem("currentCommunity", name);
  localStorage.setItem("username", username);
  localStorage.setItem("idNumber", idNumber);

  alert(`You joined ${name}.`);
  loadCurrentSession();
}

// JOIN CUSTOM COMMUNITY
function joinCustomCommunity() {
  const idInput = document.getElementById("customCommunityId");
  const communityId = idInput.value.trim();
  if (!communityId) {
    alert("Enter a Community ID.");
    return;
  }

  const username = prompt("Enter your username:");
  if (!username) return;

  const idNumber = prompt("Enter your ID number:");
  if (!idNumber) return;

  localStorage.setItem("currentCommunity", communityId);
  localStorage.setItem("username", username);
  localStorage.setItem("idNumber", idNumber);

  alert(`You joined community "${communityId}".`);
  loadCurrentSession();
}

function goToDashboard() {
  window.location.href = "/dashboard.html";
}

document.addEventListener("DOMContentLoaded", loadCurrentSession);
