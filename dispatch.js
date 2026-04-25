// dispatch.js

let socket;

function connectSocket() {
  socket = new WebSocket("ws://localhost:8080");

  socket.onopen = () => {
    document.getElementById("status").innerText = "Connected.";
  };
}

connectSocket();

function sendCall() {
  const text = document.getElementById("callText").value.trim();
  if (!text) return;

  socket.send(JSON.stringify({
    type: "callBroadcast",
    text
  }));
}
