// Nexora CAD System Unified Login (Global + Community + Master)
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get("mode") || "global";
const communityCode = urlParams.get("code") || null;

const title = document.getElementById("title");
const loginBtn = document.getElementById("loginBtn");

// MASTER credentials
const MASTER_USERNAME = "master";
const MASTER_PASSWORD = "master";

let loginRoute = "/login";

if (mode === "community") {
  title.textContent = "Nexora CAD System - Community Login";
  loginRoute = "/community-login";
}

loginBtn.onclick = async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  // MASTER LOGIN CHECK
  if (username === MASTER_USERNAME && password === MASTER_PASSWORD) {
    sessionStorage.setItem("isMaster", true);
    sessionStorage.setItem("username", username);
    alert("Master access granted. Loading all servers...");
    window.location.href = "/community.html?master=true";
    return;
  }

  try {
    const res = await fetch(loginRoute, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, communityCode }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Login failed.");
      return;
    }

    sessionStorage.setItem("isMaster", false);
    sessionStorage.setItem("username", username);

    if (mode === "community") {
      window.location.href = "/dashboard.html";
    } else {
      window.location.href = "/community.html";
    }
  } catch (err) {
    console.error(err);
    alert("Error connecting to server.");
  }
};
