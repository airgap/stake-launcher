import { Page } from "puppeteer";

import { app, BrowserWindow, ipcMain } from "electron";
import { Settings } from "./settingsModel";
import { writeFile } from "fs/promises";
import IpcMainEvent = Electron.IpcMainEvent;
import { createWindow, mainWindow } from "./backend/mainWindow";
import { scanPlans } from "./backend/scanPlans";
import { scanOrders } from "./backend/scanOrders";
import { scanBalance } from "./backend/scanBalance";

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
