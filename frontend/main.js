import * as mediasoupClient from "mediasoup-client";

const video = document.getElementById("video");
const startBtn = document.getElementById("start");
const urlInput = document.getElementById("url");
const status = document.getElementById("status");

let device;
let transport;
let consumer;
let sessionId;
let ws;

function log(msg) {
  status.textContent += msg + "\n";
}

/* ---------- Start session ---------- */
startBtn.onclick = async () => {
  status.textContent = "";
  const url = urlInput.value.trim();
  if (!url) return alert("Enter a URL");

  log("Starting session...");

  // 1️⃣ Call backend to start session
  // 192.168.29.63
  const res = await fetch("http://localhost:3000/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });

  const data = await res.json();
  sessionId = data.sessionId;
  log("Session ID: " + sessionId);

  // 2️⃣ Connect WebSocket
  ws = new WebSocket("ws://localhost:8080");

  ws.onopen = () => {
    ws.send(JSON.stringify({
      action: "getRtpCapabilities",
      sessionId
    }));
  };

  ws.onmessage = handleWsMessage;
};

/* ---------- WebSocket signaling ---------- */
async function handleWsMessage(event) {
  const msg = JSON.parse(event.data);
  console.log(msg)

  if (msg.action === "rtpCapabilities") {
    console.log("rtpCapabilities",msg.data)
    device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: msg.data });

    ws.send(JSON.stringify({
      action: "createTransport",
      sessionId
    }));
  }

  if (msg.action === "transportCreated") {
    transport = device.createRecvTransport(msg.data);

    transport.on("connect", ({ dtlsParameters }, callback) => {
      ws.send(JSON.stringify({
        action: "connectTransport",
        sessionId,
        dtlsParameters
      }));
      callback();
    });

    ws.send(JSON.stringify({
      action: "consume",
      sessionId,
      rtpCapabilities: device.rtpCapabilities
    }));
  }

  if (msg.action === "consuming") {
    consumer = await transport.consume({
      id: msg.data.consumerId,
      producerId: msg.data.producerId,
      kind: msg.data.kind,
      rtpParameters: msg.data.rtpParameters
    });

    const stream = new MediaStream();
    stream.addTrack(consumer.track);
    video.srcObject = stream;

    log("Streaming started");
  }
}
