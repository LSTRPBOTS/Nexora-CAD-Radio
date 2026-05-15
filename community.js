async function loadCommunities() {
  try {
    const res = await fetch("/communities", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();

    if (!data.success) {
      window.location.href = "/index.html";
      return;
    }

    const listDiv = document.getElementById("communityList");
    listDiv.innerHTML = "";

    data.communities.forEach(c => {
      const btn = document.createElement("button");
      btn.className = "community-btn";
      btn.textContent = `${c.name} (${c.code})`;
      btn.onclick = () => {
        window.location.href = `/index.html?mode=community&code=${encodeURIComponent(c.code)}`;
      };
      listDiv.appendChild(btn);
    });
  } catch (err) {
    console.error(err);
    alert("Error loading communities.");
  }
}

loadCommunities();
