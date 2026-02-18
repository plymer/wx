import type { Region } from "@/lib/types";

interface OutlookGridProps {
  data: Record<string, Region[]>;
}

const OutlookGrid = ({ data }: OutlookGridProps) => {
  console.log("OutlookGrid received data:", data);
  console.log(Object.keys(data));
  return (
    <>
      {Object.entries(data).map((o) => console.log(o))}
      <div className="p-4">
        <p className="text-sm italic">Outlook grid will be displayed here.</p>
      </div>
    </>
  );
};
export default OutlookGrid;
