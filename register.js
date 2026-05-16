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

      const text = await res.text();
      if (text.startsWith("<")) {
        console.error("Received HTML instead of JSON:", text.slice(0, 100));
        alert("Server returned HTML instead of JSON. Check Worker URL or deployment.");
        return;
      }

      const data = JSON.parse(text);
      console.log("Response:", data);
      alert(data.message || "Registration complete.");
    } catch (err) {
      console.error("Error:", err);
      alert("Error connecting to server. Check Worker deployment.");
    }
  });
});
