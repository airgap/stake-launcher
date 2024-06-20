// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { Settings } from "./settingsModel";
import { contextBridge, ipcRenderer } from "electron";
// const { contextBridge, ipcRenderer } = require("electron");
export type Plan = {
  name: string;
  amount: number;
  daily: number;
  duration: number;
  total: number;
};
export type Order = {
  contract: string;
  amount: number;
  lastPayment: number;
  nextPayment: number;
};

// Custom invoke function to handle no timeout
const invoke = (channel: string, ...args: unknown[]) => new Promise((resolve, reject) => {
    ipcRenderer.once(`${channel}-response`, (event, response) => {
      resolve(response);
    });

    ipcRenderer.once(`${channel}-error`, (event, error) => {
      reject(error);
    });

    ipcRenderer.send(channel, ...args);
  });
const bridgeFunctions = {
  getOrders: () => invoke("get-orders"),
  onOrdersUpdate: (callback: (orders: Order[]) => void) =>
    ipcRenderer.on("orders-update", (event, orders: Order[]) =>
      callback(orders),
    ),
  getPlans: () => invoke("get-plans"),
  onPlansUpdate: (callback: (plans: Plan[]) => void) =>
    ipcRenderer.on("plans-update", (event, plans: Plan[]) => callback(plans)),
  getBalance: () => invoke("get-balance"),
  onBalanceUpdate: (callback: (newBalance: number) => void) =>
    ipcRenderer.on("balance-update", (event, newBalance) =>
      callback(newBalance),
    ),
  getSettings: () => invoke("get-settings"),
  onSettingsLoaded: (callback: (settings: Settings) => void) =>
    ipcRenderer.on("settings-loaded", (event, settings) => {
      console.log("Got event from main!", event, settings);
      callback(settings);
    }),
  settingsChanged: (settings: Settings) => invoke("settings-changed", settings),
  onError: (callback: (error: Error) => void) =>
    ipcRenderer.on("error", (event, error: Error) => callback(error)),
};
export type ElectronAPI = typeof bridgeFunctions;
contextBridge.exposeInMainWorld("electronAPI", bridgeFunctions);
console.log("AAAAAAAA");
