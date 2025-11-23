import { CloudOff } from "lucide-react";
import { WxIcon } from "../WxIcon";

interface Props {
  condition: string | undefined;
  iconCode: string;
}

export const WxContainer = ({ condition, iconCode }: Props) => {
  return (
    <div className="flex gap-2 place-items-center">
      <div>{condition ? <WxIcon code={parseInt(iconCode)} /> : <CloudOff />}</div>
      <div>{condition ? `${condition}` : "no wx available"}</div>
    </div>
  );
};
