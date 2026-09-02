import { useDisplayTime } from "@/hooks/useDisplayTime";
import { Isobars } from "./sfc-data/Isobars";
import { Plots } from "./sfc-data/Plots";
import { Isodrosotherms } from "./sfc-data/Isodrosotherms";
import { Isotherms } from "./sfc-data/Isotherms";
import { useStationDataForPopup } from "@/hooks/useStationDataForPopup";

export const SurfaceDataLayer = () => {
  // ensure we have populated and are updating our station data for the popup
  useStationDataForPopup();

  const displayTime = useDisplayTime();

  return (
    <>
      <Isodrosotherms displayTime={displayTime} />
      <Isotherms displayTime={displayTime} />
      <Isobars displayTime={displayTime} />
      <Plots displayTime={displayTime} />
    </>
  );
};
