const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get("mode") || "global";
const communityCode = urlParams.get("code") || null;

const title = document.getElementById("title");
const loginBtn = document.getElementById("loginBtn");

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
