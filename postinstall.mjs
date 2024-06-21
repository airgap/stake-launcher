if (process.platform !== "linux") process.exit(0);
import { execSync } from 'child_process';
const chrome = "./node_modules/electron/dist/chrome-sandbox";
import {existsSync} from 'fs';
if (existsSync(chrome))
  execSync(`sudo chown root ${chrome} && sudo chmod 4755 ${chrome}`);
