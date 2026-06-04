function loadDashboard() {
  const community = localStorage.getItem("currentCommunity");
  const username = localStorage.getItem("username");
  const idNumber = localStorage.getItem("idNumber");
  const isMaster = localStorage.getItem("isMasterLogin") === "true";

  const sessionBox = document.getElementById("sessionInfo");
  const moduleButtons = document.getElementById("moduleButtons");

  // No session? Kick back to community selector
  if (!community || !username || !idNumber) {
    sessionBox.innerHTML = `
      <p>No active session found.</p>
      <button class="module-btn" onclick="window.location.href='/community.html'">
        Return to Community Selector
      </button>
    `;
    return;
  }

  // Display session info
  sessionBox.innerHTML = `
    <p><strong>Community:</strong> ${community}</p>
    <p><strong>User:</strong> ${username} (#${idNumber})</p>
    <p><strong>Master Access:</strong> ${isMaster ? "YES" : "NO"}</p>
  `;

  // Build module buttons
  moduleButtons.innerHTML = "";

  // Civilian Module
  moduleButtons.innerHTML += `
    <button class="module-btn" onclick="goTo('civilian.html')">
      Civilian Module
    </button>
  `;

  // LEO Module
  moduleButtons.innerHTML += `
    <button class="module-btn" onclick="goTo('leo.html')">
      Police / LEO Module
    </button>
  `;

  // Dispatch Module
  moduleButtons.innerHTML += `
    <button class="module-btn" onclick="goTo('dispatch.html')">
      Dispatch Module
    </button>
  `;

  // Master Panel (only if master)
  if (isMaster) {
    moduleButtons.innerHTML += `
      <button class="module-btn" onclick="goTo('admin.html')" style="background-color:#ffaa00;">
        MASTER PANEL
      </button>
    `;
  }
}

function goTo(page) {
  window.location.href = "/" + page;
}

function logout() {
  localStorage.removeItem("currentCommunity");
  localStorage.removeItem("username");
  localStorage.removeItem("idNumber");
  localStorage.removeItem("isMasterLogin");

  window.location.href = "/community.html";
}

document.addEventListener("DOMContentLoaded", loadDashboard);
