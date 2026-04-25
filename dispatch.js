// dispatch.js

const statusEl = document.getElementById("status");
const callInput = document.getElementById("callText");

let socket;

function connectSocket() {
  socket = new WebSocket("ws://localhost:8080");

  socket.onopen = () => statusEl.innerText = "Connected.";
  socket.onclose = () => {
    statusEl.innerText = "Disconnected. Reconnecting...";
    setTimeout(connectSocket, 2000);
  };
}

connectSocket();

function sendCall() {
  const text = callInput.value.trim();
  if (!text) return alert("Enter call text.");

  socket.send(JSON.stringify({
    type: "callBroadcast",
    text
  }));

  callInput.value = "";
}
