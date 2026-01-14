import mediasoup from "mediasoup";
import express from "express";
import cors from "cors";
import { v4 as uuid } from "uuid";
import { launchBrowser } from "./browser/launchBrowser.js";
import { startFFmpeg } from "./ffmpeg/startFFmpeg.js";
import { mediaCodecs } from "./ffmpeg/config.js";
import { SessionManager } from "./sessions/sessionManager.js";
import { startWsServer } from "./signalling/ws.js";
import { initMediasoup } from "./mediasoup/init.js";
import streamRouter from "./routes/browser.routes.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.HTTP_PORT || 3000;
const PLAIN_TRANSPORT_PORT = process.env.PLAIN_TRANSPORT_PORT || 5004;

const app = express();
app.use(express.json());
app.use(cors());

/* ---------- mediasoup ---------- */
// const worker = await mediasoup.createWorker();
// const router = await worker.createRouter({ mediaCodecs });
// console.log("✅ mediasoup router ready");

const { worker, router } = await initMediasoup();

/* ---------- sessions ---------- */
const sessionManager = new SessionManager();

app.use("/", streamRouter(sessionManager, router, mediaCodecs));

/* ---------- start WS signaling ---------- */
startWsServer({ router, sessionManager });

/* ---------- HTTP API ---------- */
app.post("/start", async (req, res) => {
  try {
    const { url } = req.body;
    const sessionId = uuid();

    const session = sessionManager.create(sessionId);

    // 1️⃣ launch browser
    const { browser, hwnd } = await launchBrowser(url);
    console.log(hwnd);
    session.browser = browser;

    // 2️⃣ plain transport for FFmpeg
    session.plainTransport = await router.createPlainTransport({
      listenIp: PLAIN_TRANSPORT_PORT,
      rtcpMux: true,
      comedia: true,
    });

    // 3️⃣ producer
    session.producer = await session.plainTransport.produce({
      kind: "video",
      rtpParameters: {
        codecs: mediaCodecs,
        encodings: [{ ssrc: 11111111 }],
      },
    });

    // 4️⃣ FFmpeg
    session.ffmpeg = startFFmpeg({
      ip: session.plainTransport.tuple.localIp,
      port: session.plainTransport.tuple.localPort,
      hwnd,
    });

    res.json({ sessionId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start session" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 HTTP API running on http://localhost:${PORT}`);
});
