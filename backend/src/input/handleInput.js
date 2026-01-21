import { handleKeyPress } from "./handleKeyPress.js";
import { handleMouseClick } from "./handleMouseClick.js";
import { handleScroll } from "./handleScroll.js";

export async function handleInput(session, data) {
  const page = session.page; // Puppeteer page
  if (!page) return;

  const { type, payload } = data;

  if (type === "mouseClick") {
    await handleMouseClick(session, payload);
  }

  if (type === "keyPress") {
    await handleKeyPress(page, payload);
  }

  if (type === "scroll") {
    await handleScroll(session, payload);
  }
}
