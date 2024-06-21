import { Plan } from "../frontend/preload";
import { mainWindow } from "./mainWindow";
import { urls } from "./index";
import { pageOrLogin } from "./pageOrLogin";

export const scanPlans = async (): Promise<Plan[]> => {
  const page = await pageOrLogin(urls.plans);
  const names = await page.$$eval(".plans__grid img[alt]", (imgs) =>
    imgs.map((img) => img.alt),
  );
  const { durations, daily, amounts, totals } = await page.evaluate(() => {
    const map = {
      durations: {
        regex: /^(\d+) Days?$/,
        array: [] as number[],
      },
      daily: {
        regex: /^\$((?:\d|,)+\.\d+)$/,
        array: [] as number[],
      },
      amounts: {
        regex: /^Amount \$((?:\d|,)+\.\d+)$/,
        array: [] as number[],
      },
      totals: {
        regex: /^\+ \$((?:\d|,)+\.\d+)$/,
        array: [] as number[],
      },
    } as const satisfies Record<string, { regex: RegExp; array: unknown[] }>;
    type M = typeof map;
    // type ReturnM = {[key: keyof M]: M[typeof key]['array']};
    type ReturnM = Record<keyof M, M[keyof M]["array"]>;
    const elements =
      document.querySelectorAll<HTMLParagraphElement>("div.p_plans p");
    [...elements].forEach((element) => {
      for (const { regex, array } of Object.values(map))
        if (regex.test(element.innerText)) {
          console.log("array", array);
          array.push(parseFloat(element.innerText.match(regex)?.[1] ?? "0"));
        }
    });
    return Object.entries(map).reduce((acc, [key, { array }]) => {
      acc[key as keyof ReturnM] = array;
      return acc;
    }, {} as ReturnM);
  });
  const plans = names.map(
    (name, i) =>
      ({
        name,
        amount: amounts[i],
        duration: durations[i],
        daily: daily[i],
        total: totals[i],
      }) satisfies Plan,
  );
  console.log("plans", plans);
  mainWindow.webContents.send("plans-update", plans);
  return plans;
};
