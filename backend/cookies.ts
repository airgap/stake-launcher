import { Cookie } from "puppeteer";
import { readFile, writeFile } from "fs/promises";
import { secureDelete } from "./secureDelete";
const cookieFile = "cookies.json";
export const setCookies = (c: Cookie[]) =>
  writeFile(cookieFile, JSON.stringify(c));
export const getCookies = () =>
  readFile(cookieFile, "utf8")
    .then((utf8) => JSON.parse(utf8))
    .catch(() => writeFile(cookieFile, "[]").then(() => []));
export const purgeCookies = () => secureDelete(cookieFile);
