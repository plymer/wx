import { Sunrise, Sunset, ThermometerSnowflake, ThermometerSun } from "lucide-react";

interface Props {
  normals?: {
    high: number;
    low: number;
  } | null;
  riseSet?: {
    rise: string;
    set: string;
  } | null;
}

export const NormalsContainer = ({ normals, riseSet }: Props) => {
  return (
    <div className="grid grid-cols-2 gap-2 place-items-center border-t border-black bg-neutral-600 py-2 rounded-b-md">
      <div className="grid grid-cols-3 place-items-center gap-2">
        <h1>Normal</h1>
        <div className="flex gap-2 place-items-center">
          <ThermometerSun />
          <div className="w-8 text-right">{normals?.high}&deg;C</div>
        </div>
        <div className="flex gap-2 place-items-center">
          <ThermometerSnowflake />
          <div className="w-8 text-right">{normals?.low}&deg;C</div>
        </div>
      </div>
      <div className="flex gap-2">
        <Sunrise /> {riseSet?.rise}
        <Sunset /> {riseSet?.set}
      </div>
    </div>
  );
};
