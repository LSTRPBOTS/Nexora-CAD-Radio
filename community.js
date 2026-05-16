async function loadCommunities() {
  try {
    const res = await fetch("https://nexora-systems-worker.nexora-systems.workers.dev/communities?all=true");
    const data = await res.json();

    const container = document.getElementById("communityList");
    container.innerHTML = "";

    const currentCommunity = localStorage.getItem("currentCommunity");
    const isMaster = localStorage.getItem("isMasterLogin") === "true";

    data.communities.forEach(comm => {
      const div = document.createElement("div");
      div.className = "community-item";

      let buttonLabel;
      let buttonAction;

      if (isMaster) {
        buttonLabel = "Access Community (Master)";
        buttonAction = `window.location.href='/admin.html?community=${comm.code}'`;
      } else if (currentCommunity === comm.code) {
        buttonLabel = "Go to Community";
        buttonAction = `window.location.href='/community_login.html?code=${comm.code}'`;
      } else {
        buttonLabel = "Join Community";
        buttonAction = `joinCommunity('${comm.code}')`;
      }

      div.innerHTML = `
        <h3>${comm.name}</h3>
        <p>Code: ${comm.code}</p>
        <button onclick="${buttonAction}">${buttonLabel}</button>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading communities:", err);
    alert("Error connecting to server.");
  }
}

// --- Join Community (username + ID only) ---
function joinCommunity(code) {
  const username = prompt("Enter your username:");
  if (!username) return;
  const idNumber = prompt("Enter your ID number:");
  if (!idNumber) return;

  // Save login info locally
  localStorage.setItem("currentCommunity", code);
  localStorage.setItem("username", username);
  localStorage.setItem("idNumber", idNumber);

  alert(`Welcome ${username} (#${idNumber}) to ${code}!`);
  window.location.href = `/community_login.html?code=${encodeURIComponent(code)}`;
}

document.addEventListener("DOMContentLoaded", loadCommunities);
