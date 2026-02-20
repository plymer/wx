import type { Region } from "@/lib/types";
import type { Panel } from "@/lib/types";
import OutlookCard from "./OutlookCard";
import { useOutlookActions, useOutlookRegion } from "@/stateStores/outlook";
interface OutlookGridProps {
  officeData: Record<string, Region>;
}

const OutlookGrid = ({ officeData }: OutlookGridProps) => {
  const region = useOutlookRegion();
  const actions = useOutlookActions();

  if (!officeData) return;
  console.log(officeData);

  //const columns = 3;

  return (
    <div>
      {Object.entries(officeData).map(([regionKey, regionData]) =>
        region === regionKey || !region ? (
          <div key={regionData.name}>
            <h2 className="text-xl font-bold mt-3 ml-4">{regionData.name}</h2>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${regionData.panels.length < 3 ? regionData.panels.length : regionData.panels.length % 2 === 0 ? 2 : 3}, minmax(0, 1fr))`,
              }}
            >
              {regionData.panels.map((panel: Panel) => (
                <OutlookCard
                  panel={panel}
                  key={panel.id}
                  onClick={() => {
                    actions.setRegion(regionKey);
                    actions.setValid(panel.valid);
                  }}
                />
              ))}
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
};
export default OutlookGrid;
