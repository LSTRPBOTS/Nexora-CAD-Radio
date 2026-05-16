async function loadCommunities() {
  try {
    const res = await fetch("https://nexora-systems-worker.nexora-systems.workers.dev/communities?all=true");
    const data = await res.json();

    const container = document.getElementById("communityList");
    container.innerHTML = "";

    if (!data.communities || data.communities.length === 0) {
      container.innerHTML = "<p>No communities found.</p>";
      return;
    }

    const currentCommunity = localStorage.getItem("currentCommunity");

    data.communities.forEach(comm => {
      const div = document.createElement("div");
      div.className = "community-item";
      const buttonLabel = currentCommunity === comm.code ? "Go to Community" : "Register";
      div.innerHTML = `
        <h3>${comm.name}</h3>
        <p>Code: ${comm.code}</p>
        <button onclick="handleCommunityAction('${comm.code}')">${buttonLabel}</button>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading communities:", err);
    alert("Error connecting to server.");
  }
}

function handleCommunityAction(code) {
  const currentCommunity = localStorage.getItem("currentCommunity");
  if (currentCommunity === code) {
    window.location.href = `/community_login.html?code=${encodeURIComponent(code)}`;
  } else {
    registerCommunity(code);
  }
}

async function registerCommunity(code) {
  const ownerEmail = prompt("Enter your email for staff contact:");
  if (!ownerEmail) return;

  try {
    const res = await fetch("https://nexora-systems-worker.nexora-systems.workers.dev/register-community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: code, code, ownerEmail }),
    });
    const data = await res.json();
    alert(data.message);
  } catch (err) {
    console.error("Error registering:", err);
    alert("Error connecting to server.");
  }
}

// --- Staff approval ---
document.getElementById("approveBtn").addEventListener("click", async () => {
  const code = document.getElementById("approveCode").value.trim();
  const approver = document.getElementById("approverName").value.trim();
  if (!code || !approver) return alert("Fill out both fields.");

  const res = await fetch("https://nexora-systems-worker.nexora-systems.workers.dev/approve-community", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, approver }),
  });
  const data = await res.json();
  alert(data.message);
});

// --- Admin login ---
document.getElementById("adminLoginBtn").addEventListener("click", () => {
  const panel = document.getElementById("adminLoginPanel");
  panel.style.display = panel.style.display === "none" ? "
