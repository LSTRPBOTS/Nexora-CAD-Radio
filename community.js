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
        buttonLabel = "Open Admin Panel";
        buttonAction = `window.location.href='/admin.html?community=${comm.code}'`;
      } else if (currentCommunity === comm.code) {
        buttonLabel = "Go to Community";
        buttonAction = `window.location.href='/community_login.html?code=${comm.code}'`;
      } else {
        buttonLabel = "Join Community";
        buttonAction = `registerCommunity('${comm.code}')`;
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

document.addEventListener("DOMContentLoaded", loadCommunities);
