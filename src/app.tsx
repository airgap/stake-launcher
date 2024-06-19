import "@cloudscape-design/global-styles/index.css";
import { createRoot } from "react-dom/client";
import { StakeLauncher } from "./StakeLauncher";
const elem = document.getElementById("root");
if (!elem) throw new Error("Root element not found");
const root = createRoot(elem);
root.render(<StakeLauncher />);
