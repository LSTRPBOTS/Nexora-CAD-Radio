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

// JOIN PUBLIC COMMUNITY
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

// GENERATE RANDOM COMMUNITY ID (1–30 chars, letters + numbers, case-insensitive)
function generateCommunityId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = Math.floor(Math.random() * 30) + 1; // 1–30
  let id = "";
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id; // already uppercase, so case-insensitive
}

// REGISTER COMMUNITY (auto-generated ID)
function registerCommunity() {
  const name = document.getElementById("regName").value.trim();

  if (!name) {
    alert("Enter a community name.");
    return;
  }

  let communities = JSON.parse(localStorage.getItem("communities") || "[]");

  // Generate unique ID
  let id;
  do {
    id = generateCommunityId();
  } while (communities.find(c => c.id === id));

  const owner = localStorage.getItem("username");
  const ownerId = localStorage.getItem("authUserId");

  const newCommunity = {
    id,
    name,
    owner,
    ownerId
  };

  communities.push(newCommunity);
  localStorage.setItem("communities", JSON.stringify(communities));

  alert(`Community created!\nName: ${name}\nID: ${id}`);
  loadYourCommunities();
}

// LOAD USER COMMUNITIES
function loadYourCommunities() {
  const container = document.getElementById("yourCommunities");
  const communities = JSON.parse(localStorage.getItem("communities") || "[]");
  const username = localStorage.getItem("username");

  container.innerHTML = "";

  const owned = communities.filter(c => c.owner === username);

  if (owned.length === 0) {
    container.innerHTML = "<p>You have not created any communities.</p>";
    return;
  }

  owned.forEach(c => {
    container.innerHTML += `
      <div class="community-item">
        <h3>${c.name}</h3>
        <p>ID: ${c.id}</p>
        <button onclick="joinPublicCommunity('${c.id}')">Enter Community</button>
      </div>
    `;
  });
}

// JOIN CUSTOM COMMUNITY
function joinCustomCommunity() {
  const idInput = document.getElementById("customCommunityId");
  const communityId = idInput.value.trim().toUpperCase();
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

document.addEventListener("DOMContentLoaded", () => {
  loadCurrentSession();
  loadYourCommunities();
});
