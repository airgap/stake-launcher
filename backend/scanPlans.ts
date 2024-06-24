import { Plan } from "../models";
import { mainWindow } from "./mainWindow";
import { urls } from "./index";
import { pageOrLogin } from "./pageOrLogin";

export const scanPlans = async (): Promise<Plan[]> => {
  const page = await pageOrLogin(urls.plans);
  const names = await page.$$eval(".plans__grid img[alt]", (imgs) =>
    imgs.map((img) => img.alt),
  );
  type StupidKey = "durations" | "daily" | "amounts" | "totals";
  type StupidMap = Record<StupidKey, number[]>;
  const { durations, daily, amounts, totals } = await page.evaluate(() => {
    const map: StupidMap = {
      durations: [],
      daily: [],
      amounts: [],
      totals: [],
    };
    [...document.querySelectorAll<HTMLDivElement>("div.p_plans div")].forEach(
      (div) => {
        if (div.innerText.startsWith("Amount "))
          map.amounts.push(
            parseFloat(div.innerText.split(" $")[1].replace(/,/g, "")),
          );
        else if (div.innerText.startsWith("+ "))
          map.totals.push(
            parseFloat(div.innerText.split(" $")[1].replace(/,/g, "")),
          );
      },
    );
    [
      ...document.querySelectorAll<HTMLParagraphElement>("div.p_plans p"),
    ].forEach((p) => {
      if (p.innerText.startsWith("$"))
        map.daily.push(parseFloat(p.innerText.substring(1).replace(/,/g, "")));
      else if (p.innerText.endsWith(" Days"))
        map.durations.push(
          parseFloat(p.innerText.split(" ")[0].replace(/,/g, "")),
        );
    });
    return map;
  });
  console.log(
    "names",
    names,
    "amounts",
    amounts,
    "durations",
    durations,
    "daily",
    daily,
    "totals",
    totals,
  );
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
