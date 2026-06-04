// GOOGLE LOGIN (placeholder)
function loginGoogle() {
  const username = prompt("Google Login: Enter your display name");
  if (!username) return;

  localStorage.setItem("authProvider", "google");
  localStorage.setItem("username", username);
  localStorage.setItem("authUserId", "google-" + crypto.randomUUID());

  window.location.href = "/community.html";
}

// DISCORD LOGIN (placeholder)
function loginDiscord() {
  const username = prompt("Discord Login: Enter your Discord username");
  if (!username) return;

  localStorage.setItem("authProvider", "discord");
  localStorage.setItem("username", username);
  localStorage.setItem("authUserId", "discord-" + crypto.randomUUID());

  window.location.href = "/community.html";
}

// MANUAL LOGIN
function manualLogin() {
  const user = document.getElementById("manualUser").value.trim();
  const pass = document.getElementById("manualPass").value.trim();

  if (!user || !pass) {
    alert("Enter username and password.");
    return;
  }

  // For now, no backend — just store it
  localStorage.setItem("authProvider", "manual");
  localStorage.setItem("username", user);
  localStorage.setItem("authUserId", "manual-" + crypto.randomUUID());

  window.location.href = "/community.html";
}
