import styles from "./Bubble.module.sass";
import { useMemo, useState } from "react";
import { useRequestAnimationFrame } from "./useRequestAnimationFrame";

export const Bubble = ({
  amount,
  onFinish,
}: {
  amount: number;
  onFinish: () => void;
}) => {
  const text = useMemo(
    () =>
      "" +
      (amount < 1
        ? (amount * 100).toFixed(2) + "¢"
        : "$" + (amount * 10).toFixed(2)),
    [amount],
  );
  // const [x, setX] = useState(Math.random() * 90 + 5);
  const [y, setY] = useState(110);
  const ySpeed = useMemo(() => Math.random() / 4 + 0.1, []);
  const phase = useMemo(() => Math.random() * 100, []);

  useRequestAnimationFrame(() => {
    // Animation code goes here
    setY((y) => y - ySpeed);
    console.log("y", y);
    if (y < -10) onFinish();
  });
  return (
    <div
      className={styles.Bubble}
      style={{
        filter: `blur(${5 - y / 20}px)`,
        opacity: y / 100,
        left: 50 + Math.sin(y / 25 + phase) * 25 + "vw",
        top: y + "vh",
        transform: `scale(${ySpeed * 2 + 0.5}) translate(-50%, -50%)`,
      }}
    >
      <span
        style={{
          display: "inline-block",
          position: "relative",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {text}
      </span>
    </div>
  );
};
