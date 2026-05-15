
// ======================================================
// COMMUNITY LOGIN SYSTEM
// ======================================================
// This script runs on community_login.html
// It handles logging into a specific community
// ======================================================

// STEP 1: Get community code from URL (?code=XXXX)
const params = new URLSearchParams(window.location.search);
const communityCode = params.get("code");

// STEP 2: Show which community we’re logging into
const label = document.getElementById("community-label");
if (!communityCode) {
  label.textContent = "No community selected. Go back and pick one.";
} else {
  label.textContent = "Logging into community: " + communityCode;
}

// STEP 3: Handle form submission
const form = document.getElementById("community-login-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("comm-username").value;
  const password = document.getElementById("comm-password").value;

  // STEP 4: Send login request to backend
  try {
    const res = await fetch("/community-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include", // sends cookies/session
      body: JSON.stringify({
        community_code: communityCode,
        username,
        password
      })
    });

    const data = await res.json();

    // STEP 5: Handle response
    if (!data.success) {
      alert(data.error || "Community login failed.");
      return;
    }

    // STEP 6: Redirect to dashboard
    window.location.href = "/dashboard.html";
  } catch (err) {
    console.error(err);
    alert("Error logging into community.");
  }
});
