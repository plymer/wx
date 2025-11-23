import type { RouterOutputs } from "@/lib/trpc";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger } from "../ui/AlertDialog";
import Button from "../ui/Button";
import { AlertTriangle } from "lucide-react";

interface Props {
  alerts: RouterOutputs["alpha"]["pointForecast"]["alerts"];
}

export const AlertsModal = ({ alerts }: Props) => {
  const hasWarnings = (alerts && alerts.length > 0 && alerts.some((a) => a.type === "warning")) ?? false;
  const hasWatches = (alerts && alerts.length > 0 && alerts.some((a) => a.type === "watch")) ?? false;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          className={`px-2 min-h-6 ${alerts && alerts.length > 0 ? (hasWarnings ? "bg-red-600" : hasWatches ? "bg-amber-400" : "bg-neutral-500") : ""}`}
        >
          {alerts && alerts.length > 0 ? `${alerts.length} ` : ""}
          <AlertTriangle />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-h-[calc(100dvh-2rem)] bg-neutral-800 text-white">
        {alerts && alerts.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-[calc(100dvh-8rem)] overflow-y-auto border-b border-white">
            {alerts.map((alert, index) => (
              <div key={index} className="pb-2 not:last-of-type:border-b not:last-of-type:border-white">
                <h1 className="font-bold text-lg flex justify-center place-items-center gap-2">
                  <AlertTriangle />
                  {alert.alertBannerText}
                </h1>
                <h3 className="my-1 text-xs text-center">{alert.issueTimeText}</h3>
                <p className="whitespace-pre-wrap text-sm">{alert.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No active alerts.</p>
        )}
        <AlertDialogCancel>Close</AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
};
