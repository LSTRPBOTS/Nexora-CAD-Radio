function manualLogin() {
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();

  if (!user || !pass) {
    alert("Enter username and password.");
    return;
  }

  const stored = localStorage.getItem("account-" + user.toLowerCase());
  if (!stored) {
    alert("Account not found.");
    return;
  }

  const account = JSON.parse(stored);

  if (account.password !== pass) {
    alert("Incorrect password.");
    return;
  }

  // Save session
  localStorage.setItem("authProvider", "manual");
  localStorage.setItem("username", account.username);
  localStorage.setItem("authUserId", account.userId);

  window.location.href = "/community.html";
}
