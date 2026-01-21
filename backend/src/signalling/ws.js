import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { handleInput } from "../input/handleInput.js";
dotenv.config();

export function startWsServer({ router, sessionManager }) {
  const WS_PORT = process.env.WS_PORT || 8080;
  const announcedIp = process.env.ANNOUNCED_IP || "";

  const wss = new WebSocketServer({ port: WS_PORT });

  console.log("📡 WebSocket signaling server running on ws://localhost:8080");

  wss.on("connection", (ws) => {
    ws.on("message", async (msg) => {
      const data = JSON.parse(msg.toString());
      const session = sessionManager.get(data.sessionId);

      if (!session) {
        ws.send(JSON.stringify({ error: "Invalid sessionId" }));
        return;
      }

      // 1️⃣ Router RTP capabilities
      if (data.action === "getRtpCapabilities") {
        ws.send(
          JSON.stringify({
            action: "rtpCapabilities",
            data: router.rtpCapabilities,
          })
        );
      }

      // 2️⃣ Create WebRTC transport
      if (data.action === "createTransport") {
        const transport = await router.createWebRtcTransport({
          // to run locally:
          listenIps: [{ ip: "0.0.0.0", announcedIp: announcedIp }],
          // to run on LAN:
          // listenIps: [{ ip: "0.0.0.0", announcedIp: "192.168.29.63" }],
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
        });

        session.webRtcTransport = transport;

        ws.send(
          JSON.stringify({
            action: "transportCreated",
            data: {
              id: transport.id,
              iceParameters: transport.iceParameters,
              iceCandidates: transport.iceCandidates,
              dtlsParameters: transport.dtlsParameters,
            },
          })
        );
      }

      // 3️⃣ Connect DTLS
      if (data.action === "connectTransport") {
        await session.webRtcTransport.connect({
          dtlsParameters: data.dtlsParameters,
        });
      }

      // 4️⃣ Consume producer
      if (data.action === "consume") {
        const consumer = await session.webRtcTransport.consume({
          producerId: session.producer.id,
          rtpCapabilities: data.rtpCapabilities,
          paused: false,
        });

        ws.send(
          JSON.stringify({
            action: "consuming",
            data: {
              consumerId: consumer.id,
              producerId: session.producer.id,
              kind: consumer.kind,
              rtpParameters: consumer.rtpParameters,
            },
          })
        );
      }

      // 5️⃣ Handle input events
      if (data.action === "input") {
        await handleInput(session, data);
      }
    });

    ws.on("close", () => {
      // optional: cleanup later
    });
  });

  return wss;
}
