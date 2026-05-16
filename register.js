// Make sure this file is in the same folder as register.html
// and that your Worker is deployed at nexora-systems-worker.nexora-systems.workers.dev

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("registerBtn");
  if (!btn) {
    console.error("Register button not found!");
    return;
  }

  btn.addEventListener("click", async () => {
    const name = document.getElementById("communityName").value.trim();
    const code = document.getElementById("communityCode").value.trim();
    const ownerEmail = document.getElementById("ownerEmail").value.trim();

    if (!name || !code || !ownerEmail) {
      alert("Please fill out all fields.");
      return;
    }

    console.log("Register button clicked. Sending data...");

    try {
      const res = await fetch("https://nexora-systems-worker.nexora-systems.workers.dev/register-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, ownerEmail }),
      });

      const data = await res.json();
      console.log("Response:", data);
      alert(data.message || "Registration complete.");
    } catch (err) {
      console.error("Error:", err);
      alert("Error connecting to server. Check Worker deployment.");
    }
  });
});
