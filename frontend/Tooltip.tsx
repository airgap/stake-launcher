import { Info } from "./Info";
import { Popover } from "@cloudscape-design/components";
import { ReactNode } from "react";
import styles from "./Tooltip.module.sass";

export const Tooltip = ({ children }: { children: ReactNode }) => (
  <Popover
    dismissButton={false}
    position="top"
    size="small"
    triggerType="custom"
    className={styles.Tooltip}
    content={children}
  >
    <Info />
  </Popover>
);
