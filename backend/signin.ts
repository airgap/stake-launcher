import { Page } from "puppeteer";
import { serverSettingsStore } from "./serverSettingsStore";
import { urls } from "./index";
import { newPageWithUrl } from "./newPageWithUrl";
import { setCookies } from "./cookies";

export const signIn = async () => {
  let page: Page | undefined = undefined;
  let signedIn = false;
  let attempt = 0;
  while (!signedIn) {
    attempt++;
    const { farmEmail, farmPassword } = serverSettingsStore ?? {};
    console.log("Opening signin page");
    page = await newPageWithUrl(
      urls.signin,
      Boolean(attempt === 1 && farmEmail && farmPassword),
    );
    console.log("page started");
    const emailSelector = "input[name=email]";
    const passwordSelector = "input[name=password]";
    await page.waitForSelector(emailSelector);
    if (farmEmail) await page.locator(emailSelector).fill(farmEmail);
    if (farmPassword) await page.locator(passwordSelector).fill(farmPassword);
    if (farmEmail && farmPassword) await page.locator("form .main_btn").click();
    await page.waitForNavigation({ timeout: 0 });
    while (page.url() === urls["signin/verify"])
      await page.waitForNavigation({ timeout: 0 });
    if (page.url() !== urls.signin) signedIn = true;
  }
  if (!page) return;
  setCookies(await page.cookies());
  console.log("Signed in and cached cookies");
  await page.close();
};
