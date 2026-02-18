import type { Panel } from "@/lib/types";

interface OutlookCardProps {
  data: Panel;
}

const OutlookCard = ({ data }: OutlookCardProps) => {
  return (
    <div className="p-4 border border-gray-300 rounded-md">
      <h3 className="text-lg font-semibold">{data.name}</h3>
      <p className="text-sm">{data.product}</p>
      <p className="text-xs text-gray-500">{data.valid}</p>
    </div>
  );
};
export default OutlookCard;
