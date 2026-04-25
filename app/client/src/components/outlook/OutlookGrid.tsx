import type { Region } from "@/lib/types";
import OutlookCard from "./OutlookCard";
import { useOutlookActions, useOutlookRegion } from "@/stateStores/outlook";
interface OutlookGridProps {
  officeData: Record<string, Region>;
}

const columnHelper = (regionData: Region) => {
  const columns = regionData.panels.length < 3 ? regionData.panels.length : regionData.panels.length % 2 === 0 ? 2 : 3;

  return columns === 1 ? "lg:grid-cols-1" : columns === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
};

const OutlookGrid = ({ officeData }: OutlookGridProps) => {
  const region = useOutlookRegion();
  const actions = useOutlookActions();

  console.log("OutlookGrid officeData", Object.entries(officeData));

  return (
    <div className="p-2">
      {Object.entries(officeData).map(
        ([regionKey, regionData]) =>
          (region === regionKey || !region) && (
            <div className="flex flex-col gap-2" key={regionData.name}>
              <h2 className="text-xl font-bold ">{regionData.name}</h2>
              <div className={`grid gap-2 ${columnHelper(regionData)} max-lg:grid-cols-1`}>
                {regionData.panels.map((panel) => (
                  <OutlookCard
                    panel={panel}
                    key={panel.id}
                    onClick={() => {
                      actions.setRegion(regionKey);
                      actions.setValidPeriod(panel.validPeriod);
                    }}
                  />
                ))}
              </div>
            </div>
          ),
      )}
    </div>
  );
};
export default OutlookGrid;
