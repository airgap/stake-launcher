import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Bubble } from "./Bubble";
import useInterval from "./useInterval";
export const Bubbles = ({ daily }: { daily?: number }) => {
  const [bubbles, setBubbles] = useState<Record<string, ReactNode>>({});
  const interval = 5000;
  useInterval(() => {
    if (!daily) return;
    const id = Math.random().toString().substring(2);
    setBubbles({
      ...bubbles,
      [id]: (
        <Bubble
          key={id}
          amount={((daily / 24 / 60 / 60) * interval) / 1000}
          onFinish={() => {
            console.log("Finished", id);
            delete bubbles[id];
            setBubbles(bubbles);
          }}
        />
      ),
    });
  }, interval);
  return (
    <div style={{ position: "absolute", top: 0, left: 0 }}>
      {Object.values(bubbles)}
    </div>
  );
};
