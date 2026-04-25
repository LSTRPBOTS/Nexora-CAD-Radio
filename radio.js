// radio.js

let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
if (!currentUser) currentUser = { name: "Unit 2A21", badge: "2A21" };

document.getElementById("userInfo").innerText =
  `Logged in as: ${currentUser.name} (${currentUser.badge})`;

const overlay = document.getElementById("overlay");
const pttBtn = document.getElementById("ptt");

let socket;
let mediaRecorder = null;
let recordedChunks = [];
let isTalking = false;

// Connect to signaling server
function connectSocket() {
  socket = new WebSocket("ws://localhost:8080");

  socket.onmessage = (event) => {
    let data;
    try { data = JSON.parse(event.data); } catch { return; }

    if (data.type === "audio") {
      const audio = new Audio(data.blob);
      audio.play();

      showOverlay(`${data.unitName} (${data.unitBadge})`);
      setTimeout(hideOverlay, 1500);
    }
  };
}

connectSocket();

function showOverlay(text) {
  overlay.innerText = text;
  overlay.style.display = "block";
}

function hideOverlay() {
  overlay.style.display = "none";
}

// PTT logic
pttBtn.addEventListener("mousedown", startTX);
pttBtn.addEventListener("mouseup", stopTX);
pttBtn.addEventListener("mouseleave", stopTX);

async function startTX() {
  if (isTalking) return;
  isTalking = true;
  recordedChunks = [];

  showOverlay("TRANSMITTING");

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.start();
}

function stopTX() {
  if (!isTalking) return;
  isTalking = false;

  hideOverlay();

  mediaRecorder.stop();
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "audio/webm" });
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result;

      // Send to server
      socket.send(JSON.stringify({
        type: "audio",
        blob: base64,
        unitName: currentUser.name,
        unitBadge: currentUser.badge
      }));

      // LOCAL POST-TRANSMIT PLAYBACK
      const playback = new Audio(base64);
      playback.play();
    };

    reader.readAsDataURL(blob);
  };
}
