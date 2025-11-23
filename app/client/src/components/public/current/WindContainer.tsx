import { Wind } from "lucide-react";

interface Props {
  speed: string;
  direction: string;
  gust?: string;
}

export const WindContainer = ({ speed, direction, gust }: Props) => {
  const isCalm = speed === "calm";

  return (
    <div className="grid grid-cols-2 gap-2 place-items-center">
      <Wind className="ms-auto" />
      <div>
        <div>{isCalm ? "calm" : `${direction} ${speed}`}</div>
        <div>
          {`${gust && ` G ${gust}`}`}
          {isCalm ? "" : " km/h"}
        </div>
      </div>
    </div>
  );
};
