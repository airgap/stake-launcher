import { ReactNode, useEffect, useState, useSyncExternalStore } from "react";
// import {ipcRenderer} from 'electron';
const { electronAPI } = window as any;
import { Settings, Setting } from "./settingsModel";
const subscribers = new Set<() => void>();

export let settings: Settings | undefined;
export const setOne = async <S extends Setting>(
  setting: S,
  value: Settings[S],
) => setSome({ [setting]: value });

export const setSome = async (group: Partial<Settings>) => {
  if (!settings) throw "Settings not loaded yet";
  setSettings({ ...settings, ...group });
};

export const getSettings = () => settings;

export const setSettings = (s?: Settings) => {
  settings = s;
  subscribers.forEach((callback) => callback());
};

export const subscribeToSettings = (callback: () => void) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

export const useSettings = () =>
  useSyncExternalStore(subscribeToSettings, getSettings);

// export const useSettingsStatus = () => {
//   const [settings, setSettings] = useState<Settings | undefined>(undefined);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<Error | null>(null);

//   useEffect(() => {
//     const fetchSettings = async () => {
//       try {
//         const storedSettings = store.get("settings");
//         if (storedSettings) {
//           setSettings(JSON.parse(storedSettings));
//         }
//         setLoading(false);
//       } catch (error) {
//         setError(error as Error);
//         setLoading(false);
//       }
//     };

//     const unsubscribe = subscribeToSettings(() => {
//       setSettings(getSettings());
//     });

//     fetchSettings();

//     return () => {
//       unsubscribe();
//     };
//   }, []);

//   return { balance: settings, loading, error };
// };

console.log("electronAPI", electronAPI);
electronAPI.onSettingsLoaded(setSettings);

// Load currentUser from electron store on initial load
// ipcRenderer.on('settingsLoaded', setSettings);
// const storedSettings = store.get("settings");
// if (storedSettings) {
//   settings = JSON.parse(storedSettings);
// }
