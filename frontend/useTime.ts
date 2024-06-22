import { useState, useEffect } from "react";

export const useTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const tick = () => setTime(new Date());

    const now = new Date();
    const delay = 1000 - now.getMilliseconds();

    const timeoutId = setTimeout(() => {
      tick();
      setInterval(tick, 1000);
    }, delay);

    return () => clearInterval(timeoutId);
  }, []);

  return time;
};

export default useTime;
