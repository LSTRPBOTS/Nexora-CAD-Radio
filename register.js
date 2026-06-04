function manualRegister() {
  const user = document.getElementById("regUser").value.trim();
  const pass = document.getElementById("regPass").value.trim();

  if (!user || !pass) {
    alert("Enter a username and password.");
    return;
  }

  // Store user in localStorage (temporary until backend)
  const account = {
    username: user,
    password: pass,
    userId: "manual-" + crypto.randomUUID()
  };

  localStorage.setItem("account-" + user.toLowerCase(), JSON.stringify(account));

  alert("Account created successfully!");

  window.location.href = "/login.html";
}
