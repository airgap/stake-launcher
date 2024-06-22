import { ipcMain } from "electron";
import IpcMainEvent = Electron.IpcMainEvent;

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
