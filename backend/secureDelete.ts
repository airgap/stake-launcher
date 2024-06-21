import { stat, open, unlink } from "fs/promises";
import * as crypto from "crypto";
export const secureDelete = async (filePath: string) => {
  try {
    const stats = await stat(filePath);
    const buffer = crypto.randomBytes(stats.size);

    const fileHandle = await open(filePath, "r+");
    await fileHandle.write(buffer, 0, buffer.length, 0);
    await fileHandle.sync();
    await fileHandle.close();

    await unlink(filePath);
    console.log("File securely deleted");
  } catch (err) {
    console.error("Failed to securely delete file:", err);
  }
};
