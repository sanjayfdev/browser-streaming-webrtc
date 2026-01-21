export async function handleScroll(session, payload) {
  const { page } = session;
  if (!page) return;

  const { deltaX = 0, deltaY = 0 } = payload;

  // Tune this multiplier if needed
  const SCROLL_MULTIPLIER = 1;

  await page.mouse.wheel({
    deltaX: deltaX * SCROLL_MULTIPLIER,
    deltaY: deltaY * SCROLL_MULTIPLIER
  });
}
