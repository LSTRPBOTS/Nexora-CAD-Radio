document.getElementById("registerBtn").onclick = async () => {
  const name = document.getElementById("communityName").value.trim();
  const code = document.getElementById("communityCode").value.trim();
  const ownerEmail = document.getElementById("ownerEmail").value.trim();

  const res = await fetch("/register-community", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, code, ownerEmail }),
  });

  const data = await res.json();
  alert(data.message);
};
