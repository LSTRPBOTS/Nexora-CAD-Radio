 // Fake accounts stored in JavaScript (frontend only)
const users = {
  "officer1": "1234",
  "officer2": "abcd",
  "dispatcher": "radio",
  "chief": "admin"
};

function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (users[user] && users[user] === pass) {
    // Redirect to MDT with username in URL
    window.location.href = "mdt.html?user=" + encodeURIComponent(user);
  } else {
    document.getElementById("error").innerText = "Invalid username or password";
  }
}