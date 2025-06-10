import { useEffect, useState } from "react";
import { HOUR, MINUTE } from "@/lib/utils";
import { useEndTime, useAnimationActions } from "@/stateStores/map/animation";

function clockTick(
  setClockTimer: React.Dispatch<React.SetStateAction<NodeJS.Timeout>>,
  actions: ReturnType<typeof useAnimationActions>,
) {
  // update the time right away (since we have to wait 60 seconds until it updates on its own)
  const initialTime = new Date(Math.floor(Date.now() / MINUTE) * MINUTE).getTime();
  actions.setEndTime(initialTime);
  actions.setStartTime(initialTime - 3 * HOUR);

  // our actual clock mechanism that updates the clock's time data in state
  // we are storing the NodeJS.Timeout that setInterval returns in state so we can
  // destroy it on component un-mount
  setClockTimer(
    setInterval(() => {
      const now = new Date(Math.floor(Date.now() / MINUTE) * MINUTE).getTime();
      actions.setEndTime(now);
      actions.setStartTime(now - 3 * HOUR);
    }, MINUTE),
  );
}

const useMapClock = () => {
  const actions = useAnimationActions();
  const endTime = useEndTime();

  const [clockTimer, setClockTimer] = useState<NodeJS.Timeout>();

  useEffect(() => {
    // on component mount, we want to get the exact moment in time right now and then
    // 'round it down' to the minute by setting seconds and milliseconds to zero
    const updateTime = new Date(Math.floor(Date.now() / MINUTE) * MINUTE);

    // our wait period before the actual 'ticking' clock starts is
    // our 'rounded' time, plus a minute, minus the 'raw' time in milliseconds
    const wait = updateTime.getTime() + MINUTE - endTime;

    // we wait the calculated number of milliseconds before initializing our clock-tick
    setTimeout(clockTick, wait, setClockTimer, actions);

    // if we ever unmount this component, we clear our clock-ticker interval
    // so it doesn't run in the background
    return () => {
      if (clockTimer) clearInterval(clockTimer);
      setClockTimer(undefined);
      return;
    };
  }, []);
};

export default useMapClock;
