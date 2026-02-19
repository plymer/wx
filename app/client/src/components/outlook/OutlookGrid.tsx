import type { Region } from "@/lib/types";
import type { Panel } from "@/lib/types";
import OutlookCard from "./OutlookCard";
import { useOutlookActions } from "@/stateStores/outlook";
interface OutlookGridProps {
  officeData: Record<string, Region>;
}

const OutlookGrid = ({ officeData }: OutlookGridProps) => {
  const actions = useOutlookActions();

  if (!officeData) return;
  console.log(officeData);

  const columns = 3;

  return (
    <div>
      {Object.entries(officeData).map(([regionKey, regionData]) => (
        <div key={regionData.name}>
          <h2 className="text-xl font-bold">{regionData.name}</h2>
          <div className="grid gap-2 m-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
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
      ))}
    </div>
  );
};
export default OutlookGrid;
