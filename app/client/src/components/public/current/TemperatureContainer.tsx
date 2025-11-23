import { Thermometer } from "lucide-react";

interface Props {
  tt: string;
  td: string;
}

export const TemperatureContainer = ({ tt, td }: Props) => {
  return (
    <div className="grid grid-cols-2 gap-2 place-items-center text-left">
      <Thermometer className="ms-auto" />
      <div className="text-right">
        <div>{tt}&deg;C</div>
        <div>{td}&deg;C</div>
      </div>
    </div>
  );
};
