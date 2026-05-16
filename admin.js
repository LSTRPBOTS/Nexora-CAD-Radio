document.getElementById("createBtn").onclick = async () => {
  const name = document.getElementById("communityName").value.trim();
  const code = document.getElementById("communityCode").value.trim();

  if (!name || !code) {
    alert("Please fill out both fields.");
    return;
  }

  try {
    const res = await fetch("/register-community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Community registered successfully!");
      window.location.href = "/community.html?master=true";
    } else {
      alert(data.message || "Failed to register community.");
    }
  } catch (err) {
    console.error(err);
    alert("Error connecting to server.");
  }
};
