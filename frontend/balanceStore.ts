import { useSyncExternalStore } from "react";
const subscribers = new Set<() => void>();
// import {ipcRenderer} from 'electron';
let balance: number | undefined = undefined;

export const getBalance = () => balance;

export const setBalance = (b?: number) => {
  balance = b;
  subscribers.forEach((callback) => callback());
};

export const subscribeToBalance = (callback: () => void) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

export const useBalance = () =>
  useSyncExternalStore(subscribeToBalance, getBalance);

window.electronAPI.onBalanceUpdate(setBalance);

// Load currentUser from electron store on initial load
// const storedBalance = store.get("balance");
// if (storedBalance) {
//   balance = JSON.parse(storedBalance);
// }
