import React from "react";
import { FlameKindling, Signal, SignalHigh, SignalLow, SignalMedium } from "lucide-react";

interface Props {
  aqhi:
    | {
        value: number;
        time: number;
        text?: string | undefined;
      }
    | undefined;
}

export const AqhiContainer = ({ aqhi }: Props) => {
  if (!aqhi || !aqhi.time) {
    return <div>No AQHI data available</div>;
  }

  return (
    <div className="flex gap-2 place-items-center">
      <FlameKindling />
      <div>
        <div className="flex gap-2 place-items-center">
          <AQHIIcon value={aqhi.value} />
          <div>{aqhi.value}</div>
        </div>
        <div className="text-xs italic">
          {new Date(aqhi.time * 1000).toISOString().replace("T", " ").slice(-13, -8) + "Z"}
        </div>
      </div>
    </div>
  );
};

const AQHIIcon = ({ value }: { value: number }) => {
  if (value <= 3) {
    // low
    return <SignalLow />;
  } else if (value <= 6) {
    // moderate
    return <SignalMedium />;
  } else if (value <= 10) {
    // high
    return <SignalHigh />;
  } else {
    // very high
    return <Signal />;
  }
};
