import { spawn } from "child_process";

export function startFFmpeg({ ip, port, hwnd }) {
  return spawn("ffmpeg", [
    "-loglevel",
    "info",

    // Capture
    "-filter_complex",
    `gfxcapture=hwnd=${hwnd},hwdownload,format=bgra,scale=1280:720`,

    // Framerate
    "-r",
    "30",

    // ENCODE (WebRTC-safe H264)
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-tune",
    "zerolatency",

    // 🔑 CRITICAL FIXES
    "-profile:v",
    "baseline",
    "-level",
    "3.1",
    "-pix_fmt",
    "yuv420p",

    // 🔑 Force keyframes + SPS/PPS
    "-x264-params",
    "keyint=30:min-keyint=30:no-scenecut=1:repeat-headers=1",

    "-bf",
    "0",

    // Bitrate (stable)
    "-b:v",
    "4M",
    "-maxrate",
    "4M",
    "-bufsize",
    "2M",

    // RTP
    "-f",
    "rtp",
    "-payload_type",
    "102",
    "-ssrc",
    "11111111",
    `rtp://${ip}:${port}`,
  ]);
}