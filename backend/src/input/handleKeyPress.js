export async function handleKeyPress(page, payload) {
  const { key } = payload;

  try {
    await page.keyboard.press(key);
  } catch (err) {
    console.error("Key press failed:", key);
  }
}
