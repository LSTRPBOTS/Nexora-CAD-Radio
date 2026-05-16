document.getElementById("approveBtn").onclick = async () => reviewDivision(true);
document.getElementById("denyBtn").onclick = async () => reviewDivision(false);

async function reviewDivision(approved) {
  const divisionName = document.getElementById("divisionName").value.trim();
  if (!divisionName) {
    alert("Enter division name.");
    return;
  }

  try {
    const res = await fetch("/review-division", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ divisionName, approved }),
    });

    const data = await res.json();
    alert(data.message);
  } catch (err) {
    console.error(err);
    alert("Error connecting to server.");
  }
}
