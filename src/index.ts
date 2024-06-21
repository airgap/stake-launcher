import puppeteer, { Cookie, Page } from "puppeteer";

import { app, BrowserWindow, ipcMain } from "electron";
import { Settings } from "./settingsModel";
import { loadSettings, serverSettingsStore } from "./serverSettingsStore";
import { writeFile } from "fs/promises";
import { Order, Plan } from "./preload";
import IpcMainEvent = Electron.IpcMainEvent;
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}
let mainWindow: BrowserWindow;
const createWindow = async (): Promise<void> => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 500,
    width: 500,
    resizable: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      // nodeIntegration: true,
      // contextIsolation: false
    },
    autoHideMenuBar: true,
  });

  // and load the index.html of the app.
  await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  await loadSettings(mainWindow);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const newPageWithUrl = async (url: string, headless?: boolean) => {
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
let cookies: Cookie[] = [];
export const isPageSignin = (page: Page) => page.url().includes(urls.signin);
export const urlBase = "https://www.stakingfarm.com/";
export const pages = [
  "signin",
  "dashboard",
  "orders",
  "plans",
  "signin/verify",
] as const;
export const urls = pages.reduce(
  (acc, page) => {
    acc[page] = urlBase + page;
    return acc;
  },
  {} as Record<(typeof pages)[number], string>,
);
const pageOrLoggedOut = async (url: string) => {
  const page = await newPageWithUrl(url);
  await page.waitForNetworkIdle();

  if (isPageSignin(page)) return;
  console.log("Page is not signin", page.url(), urls.signin);
  return page;
};
const pageOrLogin = async (url: string) => {
  let page = await pageOrLoggedOut(url);
  if (!page) {
    await signIn();
    console.log("Await page attempt 2");
    page = await pageOrLoggedOut(url);
    console.log("Page attempt 2 result", page);
    if (!page) throw new Error("Could not log in");
  }
  console.log("Logged in");
  return page;
};
const signIn = async () => {
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
  cookies = await page.cookies();
  console.log("Signed in and cached cookies");
  await page.close();
};

export const handle = (
  eventName: string,
  handler: (event: IpcMainEvent, ...args: any[]) => Promise<unknown>,
) =>
  ipcMain.on(eventName, async (event, ...args) => {
    try {
      const result = await handler(event, ...args);
      event.reply(`${eventName}-response`, result);
    } catch (error) {
      event.reply(`${eventName}-error`, error);
    }
  });

const scanBalance = async () => {
  const page = await pageOrLogin("https://www.stakingfarm.com/dashboard");
  const balanceSelector =
    "body > div.dashboard-section > div.dashboard-part > div:nth-child(2) > div:nth-child(1) > div > div > div > div:nth-child(1) > h1.grd-text.mt-4.mb-0";
  await page.waitForSelector(balanceSelector);
  const balanceNode = await page.$(balanceSelector);
  const balanceText = await page.evaluate((e) => e?.innerText, balanceNode);
  const balance = parseFloat(balanceText?.substring(2) ?? "0");
  mainWindow.webContents.send("balance-update", balance);
  await page.close();
};
handle("settings-changed", (e, settings: Settings) =>
  writeFile("./settings.json", JSON.stringify(settings, null, 4)),
);
handle("get-balance", () =>
  scanBalance().catch((err) => {
    mainWindow.webContents.send("error", err);
    console.log("Caught error", err);
  }),
);

const scanPlans = async (): Promise<Plan[]> => {
  const page = await pageOrLogin(urls.plans);
  const names = await page.$$eval(".plans__grid img[alt]", (imgs) =>
    imgs.map((img) => img.alt),
  );
  const { durations, daily, amounts, totals } = await page.evaluate(() => {
    const map = {
      durations: {
        regex: /^(\d+) Days?$/,
        array: [] as number[],
      },
      daily: {
        regex: /^\$((?:\d|,)+\.\d+)$/,
        array: [] as number[],
      },
      amounts: {
        regex: /^Amount \$((?:\d|,)+\.\d+)$/,
        array: [] as number[],
      },
      totals: {
        regex: /^\+ \$((?:\d|,)+\.\d+)$/,
        array: [] as number[],
      },
    } as const satisfies Record<string, { regex: RegExp; array: unknown[] }>;
    type M = typeof map;
    // type ReturnM = {[key: keyof M]: M[typeof key]['array']};
    type ReturnM = Record<keyof M, M[keyof M]["array"]>;
    const elements =
      document.querySelectorAll<HTMLParagraphElement>("div.p_plans p");
    [...elements].forEach((element) => {
      for (const { regex, array } of Object.values(map))
        if (regex.test(element.innerText)) {
          console.log("array", array);
          array.push(parseFloat(element.innerText.match(regex)?.[1] ?? "0"));
        }
    });
    return Object.entries(map).reduce((acc, [key, { array }]) => {
      acc[key as keyof ReturnM] = array;
      return acc;
    }, {} as ReturnM);
  });
  const plans = names.map(
    (name, i) =>
      ({
        name,
        amount: amounts[i],
        duration: durations[i],
        daily: daily[i],
        total: totals[i],
      }) satisfies Plan,
  );
  mainWindow.webContents.send("plans-update", plans);
  return plans;
};
handle("get-plans", () =>
  scanPlans().catch((err) => mainWindow.webContents.send("error", err)),
);

const scanOrders = async (): Promise<Order[]> => {
  const page = await pageOrLogin(urls.orders);
  const payments = await page.$$eval("#body_table script", (scripts) =>
    scripts.map(
      (script) => script.innerHTML.match(/'(\d+)', '(\d+)'/)?.slice(1) ?? [],
    ),
  );
  const { amounts, contracts } = await page.evaluate(() => {
    const map = {
      contracts: {
        regex: /^\[\d+](.+)$/,
        array: [] as string[],
      },
      amounts: {
        regex: /^\$((?:\d|,)+\.\d+)$/,
        array: [] as string[],
      },
    } as const satisfies Record<string, { regex: RegExp; array: unknown[] }>;
    type M = typeof map;
    // type ReturnM = {[key: keyof M]: M[typeof key]['array']};
    type ReturnM = Record<keyof M, M[keyof M]["array"]>;
    const elements =
      document.querySelectorAll<HTMLParagraphElement>("#body_table td");
    [...elements].forEach((element) => {
      for (const { regex, array } of Object.values(map))
        if (regex.test(element.innerText)) {
          console.log("array", array);
          const match = element.innerText.match(regex);
          if (match) array.push(match[1]);
        }
    });
    return Object.entries(map).reduce((acc, [key, { array }]) => {
      acc[key as keyof ReturnM] = array;
      return acc;
    }, {} as ReturnM);
  });
  console.log("payments", payments);
  const orders = amounts.map(
    (amount, i) =>
      ({
        amount: parseFloat(amount),
        contract: contracts[i],
        lastPayment: parseFloat(payments[i][0]) * 1000,
        nextPayment: parseFloat(payments[i][1]) * 1000,
      }) satisfies Order,
  );
  mainWindow.webContents.send("orders-update", orders);
  return orders;
};

handle("get-orders", () =>
  scanOrders().catch((err) => mainWindow.webContents.send("error", err)),
);
