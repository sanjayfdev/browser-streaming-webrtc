import { Router } from "express";
import { startStream } from "../controllers/browser.controller.js";

const streamRouter = (sessionManager, router, mediaCodecs) => {
  const streamRouter = Router();
  streamRouter.post("/start", startStream(sessionManager, router, mediaCodecs));

  // router.post("/stop", stopBrowserSession);
  return streamRouter;
};

export default streamRouter;
