import { Settings } from "./settingsModel";
import { readFile, writeFile } from "fs/promises";
import { BrowserWindow } from "electron";

export let serverSettingsStore: Settings | undefined;
export const loadSettings = async (mainWindow?: BrowserWindow) => {
  serverSettingsStore = await readFile("./settings.json", "utf8")
    .then((f) => JSON.parse(f))
    .catch(() => writeFile("./settings.json", "{}").then(() => ({})));
  mainWindow?.webContents.send("settings-loaded", serverSettingsStore);
};
