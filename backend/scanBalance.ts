import { pageOrLogin } from "./pageOrLogin";
import { mainWindow } from "./mainWindow";

export const scanBalance = async () => {
  const page = await pageOrLogin("https://www.stakingfarm.com/dashboard");
  const balanceSelector =
    "body > div.dashboard-section > div.dashboard-part > div:nth-child(2) > div:nth-child(1) > div > div > div > div:nth-child(1) > h1.grd-text.mt-4.mb-0";
  await page.waitForSelector(balanceSelector);
  const balanceNode = await page.$(balanceSelector);
  const balanceText = await page.evaluate((e) => e?.innerText, balanceNode);
  const balance = parseFloat(
    balanceText?.substring(2).replace(/,/g, "") ?? "0",
  );
  mainWindow.webContents.send("balance-update", balance);
  await page.close();
};
