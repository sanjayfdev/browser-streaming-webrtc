export async function handleMouseMove(session, payload, ws) {
  const { page, viewport, devicePixelRatio } = session;
  if (!page || !viewport) return;

  const { x, y, videoWidth, videoHeight } = payload;

  const dpr = devicePixelRatio || 1;

  // Map to browser coordinates (replace offset logic if needed)
  const cssX = (x / videoWidth) * viewport.width;
  const cssY = (y / videoHeight) * viewport.height;

  // 🔍 Ask browser what cursor should be here
  const cursor = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return "default";

    const style = window.getComputedStyle(el);
    return style.cursor || "default";
  }, { x: cssX, y: cssY });

  // 🧠 Avoid sending duplicates
  if (cursor !== session.lastCursor) {
    session.lastCursor = cursor;

    ws.send(JSON.stringify({
      action: "cursor",
      cursor
    }));
  }
}
