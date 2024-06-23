import { Page } from "puppeteer";

import { app, BrowserWindow } from "electron";
import { Settings } from "../models/settings";
import { writeFile } from "fs/promises";
import { createWindow, mainWindow } from "./mainWindow";
import { scanPlans } from "./scanPlans";
import { scanOrders } from "./scanOrders";
import { scanBalance } from "./scanBalance";
import { purgeCookies } from "./cookies";
import { handle } from "./handle";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

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

handle("settings-changed", (e, settings: Settings) =>
  writeFile("./settings.json", JSON.stringify(settings, null, 4)),
);
handle("get-balance", () =>
  scanBalance().catch((err) => {
    mainWindow.webContents.send("error", err);
    console.log("Caught error", err);
  }),
);
handle("get-plans", () =>
  scanPlans().catch((err) => mainWindow.webContents.send("error", err)),
);

handle("get-orders", () =>
  scanOrders().catch((err) => mainWindow.webContents.send("error", err)),
);

handle("purge-cookies", purgeCookies);
