// ======================================================
// COMMUNITY SELECTOR SYSTEM
// ======================================================
// This script runs on community.html
// It loads the user's communities and lets them pick one
// ======================================================

// STEP 1: Load communities from backend
async function loadCommunities() {
  try {
    const res = await fetch("/communities", {
      method: "GET",
      credentials: "include" // sends cookies/session
    });

    const data = await res.json();

    // STEP 2: If not logged in globally, send back to main login
    if (!data.success) {
      window.location.href = "/index.html";
      return;
    }

    const listDiv = document.getElementById("community-list");
    listDiv.innerHTML = "";

    // STEP 3: For each community, create a button
    data.communities.forEach(comm => {
      const btn = document.createElement("button");
      btn.textContent = comm.name + " (" + comm.code + ")";
      btn.onclick = () => {
        // STEP 4: When clicked, go to community_login.html with the community code
        window.location.href = "/community_login.html?code=" + encodeURIComponent(comm.code);
      };
      listDiv.appendChild(btn);
      listDiv.appendChild(document.createElement("br"));
    });

  } catch (err) {
    console.error(err);
    alert("Error loading communities.");
  }
}

// STEP 5: Run when page loads
window.addEventListener("load", loadCommunities);
