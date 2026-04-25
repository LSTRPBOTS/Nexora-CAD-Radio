// Nexora‑CAD Login System
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const badge = document.getElementById("badge").value.trim();
  const role = document.getElementById("role").value.trim();
  const error = document.getElementById("error");

  // --- ADMIN LOGIN ---
  if (
    username === "NEXORAADMIN" &&
    password === "NEXORA-SYSTEM-CORE" &&
    badge === "9574268"
  ) {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        name: username,
        badge: badge,
        role: "Admin",
        settings: { frequency: "154.890" },
      })
    );
    window.location.href = "./admin.html";
    return;
  }

  // --- DISPATCH LOGIN ---
  if (role === "Dispatch") {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        name: username,
        badge: badge,
        role: "Dispatch",
        settings: { frequency: "154.890" },
      })
    );
    window.location.href = "./dispatch.html";
    return;
  }

  // --- OFFICER LOGIN ---
  if (role === "Officer") {
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        name: username,
        badge: badge,
        role: "Officer",
        settings: { frequency: "154.890" },
      })
    );
    window.location.href = "./mdt.html";
    return;
  }

  // --- DEFAULT / INVALID ---
  error.innerText = "Invalid username, password, or badge.";
}
