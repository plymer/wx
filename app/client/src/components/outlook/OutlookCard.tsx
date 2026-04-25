import type { Panel } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface OutlookCardProps {
  panel: Panel;
  onClick?: () => void;
}

const OutlookCard = ({ panel, onClick }: OutlookCardProps) => {
  const [rawType, period] = panel.validPeriod.split("_");
  const type = `${rawType.charAt(0).toUpperCase()}${rawType.slice(1)}`;

  return (
    <>
      <Card
        onClick={onClick}
        className="border-neutral-300 border-2 bg-neutral-700 cursor-pointer hover:bg-neutral-600"
      >
        <CardHeader>
          <CardTitle className="flex gap-4 items-center justify-center">
            <div className="font-bold text-xl">{`${type} ${period}`}</div>
            <div className="italic text-xs">
              (Panel created:{" "}
              {new Date(panel.date).toLocaleString("en-CA", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
                hour12: false,
                timeZoneName: "short",
              })}
              )
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center">
          <img src={panel.url} />
        </CardContent>
      </Card>
    </>
  );
};
export default OutlookCard;
