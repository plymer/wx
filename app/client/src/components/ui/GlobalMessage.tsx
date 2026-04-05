import { Info, X } from "lucide-react";
import Button from "./Button";

interface Props {
  title: string;
  message: string;
  timestamp: Date;
  onClick: () => void;
}

export const GlobalMessage = ({ title, message, timestamp, onClick }: Props) => {
  return (
    <div className="fixed top-15 max-w-3/4 left-1/2 -translate-x-1/2 border-2 border-black rounded-md px-4 py-2 bg-destructive text-white flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <Info className="shrink-0" />
        <h1 className="font-bold">{title}</h1>
      </div>
      <p className="text-xs">
        {timestamp.toLocaleDateString("en-CA", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
        })}
      </p>
      <p className="text-sm">{message}</p>
      <Button className="w-fit self-center" variant="alternate" onClick={onClick}>
        <X />
        Close
      </Button>
    </div>
  );
};
