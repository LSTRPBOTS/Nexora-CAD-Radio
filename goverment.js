document.getElementById("createDivisionBtn").onclick = async () => {
  const communityCode = document.getElementById("communityCode").value.trim();
  const divisionName = document.getElementById("divisionName").value.trim();
  const divisionType = document.getElementById("divisionType").value;

  if (!communityCode || !divisionName) {
    alert("Please fill out all fields.");
    return;
  }

  try {
    const res = await fetch("/create-division", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communityCode, divisionName, divisionType }),
    });

    const data = await res.json();

    alert(data.message);
  } catch (err) {
    console.error(err);
    alert("Error connecting to server.");
  }
};
