# Real-Time Browser Streaming (WebRTC + mediasoup)

A real-time browser streaming system that captures a backend browser session and streams it live to remote clients using WebRTC.

## 🚀 Features
- Live browser capture using FFmpeg
- RTP streaming into mediasoup (SFU)
- WebRTC-based playback in browser
- WebSocket-based signaling
- Multi-viewer scalable architecture
- Frontend and backend can run on separate machines

## 🧠 Tech Stack
- Node.js
- mediasoup (SFU)
- FFmpeg
- WebRTC
- WebSockets
- Puppeteer / Chromium

## 🏗 Architecture
Browser → FFmpeg → RTP → mediasoup → WebRTC → Client Browser

## 📸 Screenshots
![Streaming UI](screenshots/streaming-ui.png)
![Backend Pipeline](screenshots/backend-pipeline.png)

## ⚙️ How to Run

### Backend
cd backend
npm install
node src/server.js

### Frontend
cd frontend
npm install
npm run dev

Then open the frontend in your browser and start a session.

📚 What I Learned

How RTP streaming works with mediasoup

Why SFU architecture is needed for scalable WebRTC

WebSocket-based signaling design

Session lifecycle management in real-time systems

📌 Notes

Requires Node.js v18

FFmpeg must be installed and available in PATH

Built for learning and exploration of real-time systems.

---

## 🧩 STEP 4 — Optional: Backend README (`backend/README.md`)

```md
## Backend

Handles:
- Browser automation
- FFmpeg capture
- RTP streaming
- mediasoup SFU
- WebSocket signaling

### Requirements
- Node.js v18
- FFmpeg installed
