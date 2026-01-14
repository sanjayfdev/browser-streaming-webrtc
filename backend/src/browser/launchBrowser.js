import puppeteer from "puppeteer";
import { execSync } from "child_process";

function getHwndByPid(pid) {
  const cmd = `powershell "Get-Process -Id ${pid} | Select -Expand MainWindowHandle"`;
  const handle = execSync(cmd).toString().trim();
  if (!handle || handle === "0") return null;
  return "0x" + parseInt(handle).toString(16);
}

export async function launchBrowser(urlToOpen) {
  // 1. Log the URL to your console so you can see it
  console.log(`🔍 Attempting to open URL: "${urlToOpen}"`);

  // 2. Safety: If the URL is missing or wrong, use a default
  if (!urlToOpen || !urlToOpen.startsWith("http")) {
    console.warn("⚠️ URL was invalid or missing protocol. Using default.");
    urlToOpen = "https://www.google.com";
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      "--window-position=0,0",
      "--window-size=1280,720",
      "--force-device-scale-factor=1",
      "--disable-infobars",
    ],
  });

  const pages = await browser.pages();
  const page = pages[0];
  const hwnd = getHwndByPid(browser.process().pid);
  try {
    // This is line 24 where it was crashing:
    await page.goto(urlToOpen, { waitUntil: "domcontentloaded" });
    console.log("✅ Browser navigated successfully");
  } catch (error) {
    console.error("❌ Failed to navigate. Check the URL string.");
    throw error;
  }

  return { browser, hwnd, page };
}
