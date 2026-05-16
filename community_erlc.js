// Save ERLC API key
document.getElementById("saveKeyBtn").onclick = async () => {
  const apiKey = document.getElementById("apiKeyInput").value.trim();

  const res = await fetch("/register-erlc-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });

  const data = await res.json();
  alert(data.message);
};

// Send a test event (call) to ERLC
document.getElementById("sendEventBtn").onclick = async () => {
  const eventType = "CALL_CREATED";
  const payload = {
    title: "Traffic Stop",
    description: "Vehicle stopped for speeding.",
    location: "Main St & 2nd Ave",
    priority: "Medium",
  };

  const res = await fetch("/erlc/send-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, payload }),
  });

  const data = await res.json();
  alert("ERLC response: " + JSON.stringify(data));
};
