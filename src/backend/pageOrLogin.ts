import { signIn } from "./signin";
import { pageOrLoggedOut } from "./pageOrLoggedOut";

export const pageOrLogin = async (url: string) => {
  let page = await pageOrLoggedOut(url);
  if (!page) {
    await signIn();
    console.log("Await page attempt 2");
    page = await pageOrLoggedOut(url);
    console.log("Page attempt 2 result", page);
    if (!page) throw new Error("Could not log in");
  }
  console.log("Logged in");
  return page;
};
