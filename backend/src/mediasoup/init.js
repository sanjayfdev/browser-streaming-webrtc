import mediasoup from "mediasoup";
import { mediaCodecs } from "../ffmpeg/config.js";

export const initMediasoup = async () => {
  const worker = await mediasoup.createWorker();
  const router = await worker.createRouter({ mediaCodecs });
  console.log("✅ mediasoup router ready");
  return { worker, router };
}   