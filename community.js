// --- community.js (fixed) ---
async function loadCommunities() {
  try {
    // Always call the Worker domain directly
    const res = await fetch("https://nexora-systems-worker.nexora-systems.workers.dev/communities?all=true");
    const text = await res.text();

    // Detect if we accidentally got HTML
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
        <button onclick="loginToCommunity('${comm.code}')">Login</button>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading communities:", err);
    alert("Error connecting to server. Check Worker deployment.");
  }
}

async function loginToCommunity(code) {
  console.log("Logging into community:", code);
  window.location.href = `/community_login.html?code=${encodeURIComponent(code)}`;
}

// Load communities when page opens
document.addEventListener("DOMContentLoaded", loadCommunities);
