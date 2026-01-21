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
  const res = await fetch("http://127.0.0.1:3000/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = await res.json();
  sessionId = data.sessionId;
  log("Session ID: " + sessionId);

  // 2️⃣ Connect WebSocket
  ws = new WebSocket("ws://127.0.0.1:8080");

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        action: "getRtpCapabilities",
        sessionId,
      })
    );
  };

  ws.onmessage = handleWsMessage;
};

/* ---------- WebSocket signaling ---------- */
async function handleWsMessage(event) {
  const msg = JSON.parse(event.data);
  console.log(msg);

  if (msg.action === "rtpCapabilities") {
    console.log("rtpCapabilities", msg.data);
    device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: msg.data });

    ws.send(
      JSON.stringify({
        action: "createTransport",
        sessionId,
      })
    );
  }

  if (msg.action === "transportCreated") {
    transport = device.createRecvTransport(msg.data);

    transport.on("connect", ({ dtlsParameters }, callback) => {
      ws.send(
        JSON.stringify({
          action: "connectTransport",
          sessionId,
          dtlsParameters,
        })
      );
      callback();
    });

    ws.send(
      JSON.stringify({
        action: "consume",
        sessionId,
        rtpCapabilities: device.rtpCapabilities,
      })
    );
  }

  if (msg.action === "consuming") {
    consumer = await transport.consume({
      id: msg.data.consumerId,
      producerId: msg.data.producerId,
      kind: msg.data.kind,
      rtpParameters: msg.data.rtpParameters,
    });

    const stream = new MediaStream();
    stream.addTrack(consumer.track);
    video.srcObject = stream;

    log("Streaming started");
  }
}

function getActiveVideoRect(video) {
  const videoAspect = video.videoWidth / video.videoHeight;
  const elementAspect = video.clientWidth / video.clientHeight;

  let activeWidth, activeHeight, offsetX, offsetY;

  if (elementAspect > videoAspect) {
    // Black bars on left/right
    activeHeight = video.clientHeight;
    activeWidth = activeHeight * videoAspect;
    offsetX = (video.clientWidth - activeWidth) / 2;
    offsetY = 0;
  } else {
    // Black bars on top/bottom
    activeWidth = video.clientWidth;
    activeHeight = activeWidth / videoAspect;
    offsetX = 0;
    offsetY = (video.clientHeight - activeHeight) / 2;
  }

  return { activeWidth, activeHeight, offsetX, offsetY };
}


video.addEventListener("click", (e) => {
  const rect = video.getBoundingClientRect();
  console.log(rect)
  const { activeWidth, activeHeight, offsetX, offsetY } =
    getActiveVideoRect(video);

  const x = e.clientX - rect.left - offsetX;
  const y = e.clientY - rect.top - offsetY;
  console.log("x , y",x,y)
  console.log("height, width", activeHeight,activeWidth)
  // ❌ Click inside black bars → ignore
  if (x < 0 || y < 0 || x > activeWidth || y > activeHeight) {
    console.log("Click in black bar, ignored");
    return;
  }

  ws.send(JSON.stringify({
    action: "input",
    type: "mouseClick",
    sessionId,
    payload: {
      x,
      y,
      videoWidth: activeWidth,
      videoHeight: activeHeight
    }
  }));
});

video.addEventListener("wheel", (e) => {
  e.preventDefault(); // ❗ prevent page scrolling

  ws.send(JSON.stringify({
    action: "input",
    type: "scroll",
    sessionId,
    payload: {
      deltaX: e.deltaX,
      deltaY: e.deltaY
    }
  }));
}, { passive: false });

document.addEventListener("keydown", (e) => {
  ws.send(
    JSON.stringify({
      action: "input",
      type: "keyPress",
      sessionId,
      payload: {
        key: e.key,
      },
    })
  );
});


