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

document.addEventListener("DOMContentLoaded", loadCommunities);
