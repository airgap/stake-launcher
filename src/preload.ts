// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { Settings } from "./settingsModel";

const { contextBridge, ipcRenderer } = require("electron");
const bridgeFunctions = {
  getBalance: () => ipcRenderer.invoke("get-balance"),
  onBalanceUpdate: (callback: (newBalance: number) => void) =>
    ipcRenderer.on("balance-update", (event, newBalance) =>
      callback(newBalance),
    ),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  onSettingsLoaded: (callback: (settings: Settings) => void) =>
    ipcRenderer.on("settings-loaded", (event, settings) => {
      console.log("Got event from main!", event, settings);
      callback(settings);
    }),
  settingsChanged: (settings: Settings) =>
    ipcRenderer.invoke("settings-changed", settings),
};
export type ElectronAPI = typeof bridgeFunctions;
contextBridge.exposeInMainWorld("electronAPI", bridgeFunctions);
console.log("AAAAAAAA");
