import { v4 as uuid } from "uuid";
import { launchBrowser } from "../browser/launchBrowser.js";
import { startFFmpeg } from "../ffmpeg/startFFmpeg.js";

export const startStream = (sessionManager, router, mediaCodecs) => async (req, res) => {
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
      listenIp: "127.0.0.1",
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
};
