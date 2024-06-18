import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
const useRequestAnimationFrame = (callback: (time: number) => void) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = (time: number) => {
    if (previousTimeRef.current) callback(time - previousTimeRef.current);
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);
};
export const Bubble = ({
  amount,
  onFinish,
}: {
  amount: number;
  onFinish: () => void;
}) => {
    const text = useMemo(() => amount < 1 ? Math.round(amount*100) + '¢' : '$' + Math.round(amount*10)/10,[amount])
  // const [x, setX] = useState(Math.random() * 90 + 5);
  const [y, setY] = useState(50);
  const ySpeed = useMemo(() => Math.random() / 4 + 0.1, []);

  useRequestAnimationFrame(() => {
    // Animation code goes here
    setY((y) => y - ySpeed);
    console.log("y", y);
    if (y < -10) onFinish();
  });
  return (
    <div
      style={{
        position: "absolute",
        // width: "10vw",
        // height: "10vw",
        padding: "4vw",
        left: 50 + Math.sin(y / 25) * 25 + "vw",
        top: y + "vh",
        borderRadius: "50%",
        backgroundColor: "#ffffff33",
      }}
    >
      {amount}
    </div>
  );
};
export const Bubbles = ({ daily }: { daily: number }) => {
  const [bubbles, setBubbles] = useState<Record<string, ReactNode>>({});
  useEffect(() => {
    const id = Math.random().toString().substring(2);
    setTimeout(
      () =>
        setBubbles({
          ...bubbles,
          [id]: (
            <Bubble
              key={id}
              amount={10}
              onFinish={() => {
                console.log("Finished", id);
                delete bubbles[id];
                setBubbles(bubbles);
              }}
            />
          ),
        }),
      1000,
    );
  }, []);
  return (
    <div style={{ position: "absolute", top: 0, left: 0 }}>
      {Object.values(bubbles)}
    </div>
  );
};
