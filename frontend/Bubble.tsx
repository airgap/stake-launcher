import styles from "./Bubble.module.sass";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRequestAnimationFrame } from "./useRequestAnimationFrame";
const isMouseEventInRect = (event: MouseEvent, rect: DOMRect): boolean =>
  event.clientX >= rect.left &&
  event.clientX <= rect.right &&
  event.clientY >= rect.top &&
  event.clientY <= rect.bottom;
export const Bubble = ({
  amount,
  onFinish,
}: {
  amount: number;
  onFinish: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const text = useMemo(
    () =>
      amount < 1 ? (amount * 100).toFixed(2) + "¢" : "$" + amount.toFixed(2),
    [amount],
  );
  const [y, setY] = useState(110);
  const ySpeed = useMemo(() => Math.random() / 4 + 0.1, []);
  const phase = useMemo(() => Math.random() * 100, []);
  const [lastMouseEvent, setLastMouseEvent] = useState<MouseEvent>();
  const [hovered, setHovered] = useState(false);
  const x = 50 + Math.sin(y / 25 + phase) * 25 + "vw";
  const rect = ref.current?.getBoundingClientRect();
  const callback = useCallback(setLastMouseEvent, []);
  useEffect(
    () =>
      setHovered(
        Boolean(
          lastMouseEvent && rect && isMouseEventInRect(lastMouseEvent, rect),
        ),
      ),
    [lastMouseEvent, rect?.toJSON()],
  );
  useEffect(() => {
    window.addEventListener("mousemove", callback);
    return () => window.removeEventListener("mousemove", callback);
  }, []);

  useRequestAnimationFrame(() =>
    y < -10 ? onFinish() : setY((y) => y - ySpeed),
  );
  return (
    <div
      ref={ref}
      className={styles.Bubble}
      style={{
        filter: `blur(${5 - y / 20}px)`,
        opacity: hovered ? 0.5 : 1, // * window.innerHeight / y,
        left: x,
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
