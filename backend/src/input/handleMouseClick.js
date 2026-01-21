export async function handleMouseClick(session, payload) {
  const { x, y, videoWidth, videoHeight } = payload;
  const { page } = session;

  const browserViewport = page.viewport(); // { width, height }

  if (!browserViewport) return;

  const browserX = (x / videoWidth) * browserViewport.width;
  const browserY = (y / videoHeight) * browserViewport.height - 85;
 
  await page.mouse.move(browserX, browserY);
  await page.mouse.down();
  await page.mouse.up();
}
