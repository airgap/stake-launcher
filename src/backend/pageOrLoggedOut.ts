import { newPageWithUrl } from "./newPageWithUrl";
import { isPageSignin, urls } from "../index";

export const pageOrLoggedOut = async (url: string) => {
  const page = await newPageWithUrl(url);
  await page.waitForNetworkIdle();

  if (isPageSignin(page)) return;
  console.log("Page is not signin", page.url(), urls.signin);
  return page;
};
