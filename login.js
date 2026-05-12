document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    username: document.querySelector("#username").value,
    password: document.querySelector("#password").value,
    badge: document.querySelector("#badge").value,
    unit: document.querySelector("#unit").value
  };

  const res = await fetch("https://nexora-kv-manager-creator.nexora-systems.workers.dev/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (result.success) {
    alert("Welcome back, " + data.username + "!");
    window.location.href = "mdt.html"; // or dispatch.html, whichever is next
  } else {
    alert("Invalid username or password.");
  }
});
