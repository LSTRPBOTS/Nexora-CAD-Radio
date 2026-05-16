// --- Load communities ---
async function loadCommunities() {
  try {
    const res = await fetch("https://nexora-systems-worker.nexora-systems.workers.dev/communities?all=true");
    const text = await res.text();

    if (text.startsWith("<")) {
      console.error("Received HTML instead of JSON:", text.slice(0, 100));
      alert("Server returned HTML instead of JSON. Check Worker URL or deployment.");
      return;
    }

    const data = JSON.parse(text);
    console.log("Communities loaded:", data);

    const container = document.getElementById("communityList");
    container.innerHTML = "";

    if (!data.communities || data.communities.length === 0) {
      container.innerHTML = "<p>No communities found.</p>";
      return;
    }

    data.communities.forEach(comm => {
      const div = document.createElement("div");
      div.className = "community-item";
      div.innerHTML = `
        <h3>${comm.name}</h3>
        <p>Code: ${comm.code}</p>
        <button onclick="registerCommunity('${comm.name}','${comm.code}')">Register</button>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading communities:", err);
    alert("Error connecting to server. Check Worker deployment.");
  }
}

// --- Normal user: register existing community ---
async function registerCommunity(name, code) {
  const ownerEmail = prompt("Enter your email for staff contact:");
  if (!ownerEmail) return;

  try {
    const res = await fetch("https://nexora-systems-worker.nexora-systems.workers.dev/register-community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, ownerEmail }),
    });

    const data = await res.json();
    alert(data.message);
  } catch (err) {
    console.error("Error registering community:", err);
    alert("Error connecting to server. Check Worker deployment.");
  }
}

// --- Create new community (pending approval) ---
document.getElementById("createCommunityBtn").addEventListener("click", async () => {
  const name = document.getElementById("newCommunityName").value.trim();
  const code = document.getElementById("newCommunityCode").value.trim();
  const ownerEmail = document.getElementById("newOwnerEmail").value.trim();

  if (!name || !code || !ownerEmail) {
    alert("Please fill out all fields.");
    return;
  }

  try {
    const res = await fetch("https://nexora-systems-worker.nexora-systems.workers.dev/register-community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, ownerEmail }),
    });

    const data = await res.json();
    alert(data.message);
    loadCommunities();
  } catch (err) {
    console.error("Error creating community:", err);
    alert("Error connecting to server. Check Worker deployment.");
  }
});

// --- Staff approval ---
document.getElementById("approveBtn").addEventListener("click", async () => {
  const code = document.getElementById("approveCode").value.trim();
  const approver = document.getElementById("approverName").value.trim();

  if (!code || !approver) {
    alert("Please fill out both fields.");
    return;
  }

  try {
    const res = await fetch("https://nexora-systems-worker.nexora-systems.workers.dev/approve-community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, approver }),
    });

    const data = await res.json();
    alert(data.message);
  } catch (err) {
    console.error("Error approving community:", err);
    alert("Error connecting to server. Check Worker deployment.");
  }
});

// --- Master-only admin panel visibility ---
function checkMasterLogin() {
  const isMaster = localStorage.getItem("isMasterLogin") === "true";

  const adminBtn = document.getElementById("adminPanelBtn");
  const adminPanel = document.getElementById("adminPanel");

  if (isMaster) {
    adminBtn.style.display = "inline-block";
  } else {
    adminBtn.style.display = "none";
    adminPanel.style.display = "none";
  }
}

// Toggle admin panel
document.getElementById("adminPanelBtn").addEventListener("click", () => {
  const panel = document.getElementById("adminPanel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
});

// --- Admin create community (bypass approval) ---
document.getElementById("adminCreateBtn").addEventListener("click", async () => {
  const name = document.getElementById("adminCommunityName").value.trim();
  const code = document.getElementById("adminCommunityCode").value.trim();
  const ownerEmail = document.getElementById("adminOwnerEmail").value.trim();
  const masterKey = document.getElementById("adminMasterKey").value.trim();

  if (!name || !code || !ownerEmail || !masterKey) {
    alert("Please fill out all fields.");
    return;
  }

  try {
    const res = await fetch("https://nexora-systems-worker.nexora-systems.workers.dev/admin-create-community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, ownerEmail, masterKey }),
    });

    const data = await res.json();
    alert(data.message);
    loadCommunities();
  } catch (err) {
    console.error("Error creating community (admin):", err);
    alert("Error connecting to server. Check Worker deployment.");
  }
});

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  loadCommunities();
  checkMasterLogin();
});
