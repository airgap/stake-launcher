import { loadSettings, serverSettingsStore } from "../serverSettingsStore";
import puppeteer from "puppeteer";
import { cookies, mainWindow } from "./mainWindow";

export const newPageWithUrl = async (url: string, headless?: boolean) => {
  await loadSettings(mainWindow);
  const browser = await puppeteer.launch({
    headless: headless ?? serverSettingsStore?.headless,
    devtools: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setCookie(...cookies);
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().includes("jivosite.com")) {
      request.abort();
      return;
    }
    request.continue();
  });
  await page.setViewport({
    width: 1920,
    height: 1080,
  });
  await page.goto(url);
  return page;
};
