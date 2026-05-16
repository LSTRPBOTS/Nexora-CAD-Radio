async function loadCommunities() {
  const urlParams = new URLSearchParams(window.location.search);
  const isMaster = urlParams.get("master") === "true";

  try {
    const res = await fetch(isMaster ? "/communities?all=true" : "/communities", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();

    if (!data.success) {
      alert("Error loading communities.");
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
        window.location.href =
          `/index.html?mode=community&code=${encodeURIComponent(c.code)}&master=${isMaster}`;
      };
      listDiv.appendChild(btn);
    });

    const registerBtn = document.getElementById("registerBtn");
    if (isMaster) {
      registerBtn.style.display = "inline-block";
      registerBtn.onclick = () => {
        window.location.href = "/admin.html";
      };
    } else {
      registerBtn.style.display = "none";
    }
  } catch (err) {
    console.error(err);
    alert("Error loading communities.");
  }
}

loadCommunities();
