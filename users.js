function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function initDefaultAdmin() {
  let users = getUsers();

  const exists = users.some(
    u => u.username === "NEXORAADMIN" && u.badge === "9574268"
  );

  if (!exists) {
    users.push({
      username: "NEXORAADMIN",
      password: "NEXORA-SYSTEM-CORE",
      badge: "9574268",
      isAdmin: true
    });
    saveUsers(users);
  }
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}
