import { useSyncExternalStore } from "react";
import { Settings, Setting } from "../models/settingsModel";
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

export const getSettings = (): Settings | undefined => settings;

export const setSettings = (s?: Settings) => {
  settings = s;
  subscribers.forEach((callback) => callback());
  console.log("setSettings", settings);
};

export const subscribeToSettings = (callback: () => void) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

export const useSettings = (): Settings | undefined =>
  useSyncExternalStore(subscribeToSettings, getSettings);

window.electronAPI.onSettingsLoaded(setSettings);
