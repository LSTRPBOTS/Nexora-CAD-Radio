function login() {
  const badge = document.getElementById("badge").value;
  const mode = document.getElementById("mode").value;

  const officers = JSON.parse(localStorage.getItem("officers")) || {};
  const dispatchers = JSON.parse(localStorage.getItem("dispatchers")) || {};

  // ============================
  // ADMIN LOGIN
  // ============================
  if (mode === "admin") {
    if (badge === "ADMINOFLLW") {
      window.location.href = "admin.html?badge=" + badge + "&role=admin";
    } else {
      document.getElementById("error").innerText = "Invalid admin badge";
    }
    return;
  }

  // ============================
  // DISPATCH LOGIN
  // ============================
  if (mode === "dispatch") {

    // Admin can dispatch
    if (badge === "ADMINOFLLW") {
      window.location.href = "dispatch.html?badge=" + badge + "&role=dispatch";
      return;
    }

    // Dispatch members added in admin panel
    if (dispatchers[badge]) {
      window.location.href =
        "dispatch.html?badge=" + badge +
        "&name=" + dispatchers[badge].name +
        "&role=dispatch";
      return;
    }

    // Everyone else denied
    document.getElementById("error").innerText =
      "You are not authorized for dispatch";
    return;
  }

  // ============================
  // OFFICER LOGIN
  // ============================
  if (!officers[badge]) {
    document.getElementById("error").innerText = "Invalid badge number";
    return;
  }

  const o = officers[badge];
  const rank = o.rank;

  // ============================
  // RANK GROUPS
  // ============================

  // LOW RANKS (CAD ONLY)
  const lowRank =
    rank.includes("Officer") ||
    rank.includes("Cadet") ||
    rank.includes("Recruit");

  // MID/HIGH RANKS (CAD + MDT)
  const highRank =
    rank.includes("Detective") ||
    rank.includes("Investigator") ||
    rank.includes("Sergeant") ||
    rank.includes("Lieutenant") ||
    rank.includes("Captain") ||
    rank.includes("Major") ||
    rank.includes("Superintendent") ||
    rank.includes("Colonel");

  // ============================
  // MDT LOGIN
  // ============================
  if (mode === "mdt") {
    if (highRank) {
      window.location.href =
        "mdt.html?badge=" + badge +
        "&callsign=" + o.callsign +
        "&department=" + o.department +
        "&rank=" + rank +
        "&role=mdt";
      return;
    } else {
      document.getElementById("error").innerText =
        "Your rank does not have MDT access";
      return;
    }
  }

  // ============================
  // CAD LOGIN (EVERYONE CAN USE CAD)
  // ============================
  if (mode === "cad") {
    window.location.href =
      "cad.html?badge=" + badge +
      "&callsign=" + o.callsign +
      "&department=" + o.department +
      "&rank=" + rank +
      "&role=cad";
    return;
  }
}