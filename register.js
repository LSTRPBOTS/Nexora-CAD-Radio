document.getElementById("registerBtn").onclick = async () => {
  const name = document.getElementById("communityName").value.trim();
  const code = document.getElementById("communityCode").value.trim();
  const ownerEmail = document.getElementById("ownerEmail").value.trim();

  if (!name || !code || !ownerEmail) {
    alert("Please fill out all fields.");
    return;
  }

  try {
    const res = await fetch("https://nexora-systems-worker.nexora-systems.workers.dev/register-community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, ownerEmail }),
    });

    const data = await res.json();
    alert(data.message);
  } catch (err) {
    alert("Error connecting to server. Check Worker deployment.");
    console.error(err);
  }
};
