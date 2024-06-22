import { Order } from "../frontend/preload";
import { pageOrLogin } from "./pageOrLogin";
import { mainWindow } from "./mainWindow";
import { urls } from "./index";

export const scanOrders = async (): Promise<Order[]> => {
  const page = await pageOrLogin(urls.orders);
  const payments = await page.$$eval("#body_table script", (scripts) =>
    scripts.map(
      (script) => script.innerHTML.match(/'(\d+)', '(\d+)'/)?.slice(1) ?? [],
    ),
  );
  const expires = await page.$$eval(
    "#body_table button.table_button.neutral",
    (buttons) =>
      buttons.map(
        (button) => +new Date(button.getAttribute("data-exp_time") ?? "0"),
      ),
  );
  const { amounts, contracts } = await page.evaluate(() => {
    const map = {
      contracts: {
        regex: /^\[\d+](.+)$/,
        array: [] as string[],
      },
      amounts: {
        regex: /^\$((?:\d|,)+\.\d+)$/,
        array: [] as string[],
      },
    } as const satisfies Record<string, { regex: RegExp; array: unknown[] }>;
    type M = typeof map;
    // type ReturnM = {[key: keyof M]: M[typeof key]['array']};
    type ReturnM = Record<keyof M, M[keyof M]["array"]>;
    const elements =
      document.querySelectorAll<HTMLParagraphElement>("#body_table td");
    [...elements].forEach((element) => {
      for (const { regex, array } of Object.values(map))
        if (regex.test(element.innerText)) {
          console.log("array", array);
          const match = element.innerText.match(regex);
          if (match) array.push(match[1]);
        }
    });
    return Object.entries(map).reduce((acc, [key, { array }]) => {
      acc[key as keyof ReturnM] = array;
      return acc;
    }, {} as ReturnM);
  });
  console.log("payments", payments);
  const orders = amounts.map(
    (amount, i) =>
      ({
        amount: parseFloat(amount),
        contract: contracts[i],
        lastPayment: parseFloat(payments[i][0]) * 1000,
        nextPayment: parseFloat(payments[i][1]) * 1000,
        expires: expires[i],
      }) satisfies Order,
  );
  console.log("orders", orders);
  mainWindow.webContents.send("orders-update", orders);
  return orders;
};
