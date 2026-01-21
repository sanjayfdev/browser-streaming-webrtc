import express from "express";
import cors from "cors";
import { mediaCodecs } from "./ffmpeg/config.js";
import { SessionManager } from "./sessions/sessionManager.js";
import { startWsServer } from "./signalling/ws.js";
import { initMediasoup } from "./mediasoup/init.js";
import streamRouter from "./routes/browser.routes.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.HTTP_PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors());

/* ---------- mediasoup ---------- */
const { worker, router } = await initMediasoup();

/* ---------- sessions ---------- */
const sessionManager = new SessionManager();

app.use("/", streamRouter(sessionManager, router, mediaCodecs));

/* ---------- start WS signaling ---------- */
startWsServer({ router, sessionManager });

/* ---------- start HTTP API ---------- */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 HTTP API running on http://localhost:${PORT}`);
});
