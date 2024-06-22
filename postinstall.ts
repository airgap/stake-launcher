if (process.platform !== "linux") process.exit(0);
import { existsSync } from "fs";
import { execSync } from "child_process";
const chrome = "./node_modules/electron/dist/chrome-sandbox";
if (existsSync(chrome))
  execSync(`sudo chown root ${chrome} && sudo chmod 4755 ${chrome}`);
