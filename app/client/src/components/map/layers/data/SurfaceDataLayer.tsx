import { useDisplayTime } from "@/hooks/useDisplayTime";

import { useZoom } from "@/stateStores/map/mapView";

import { Isobars } from "./sfc-data/Isobars";
import { Popups } from "./sfc-data/Popups";
import { Plots } from "./sfc-data/Plots";
import { Isodrosotherms } from "./sfc-data/Isodrosotherms";
import { Isotherms } from "./sfc-data/Isotherms";

export const SurfaceDataLayer = () => {
  const zoom = useZoom();

  const displayTime = useDisplayTime();

  return (
    <>
      <Isodrosotherms displayTime={displayTime} />
      <Isotherms displayTime={displayTime} />
      <Isobars displayTime={displayTime} />
      <Plots displayTime={displayTime} />
      <Popups zoom={zoom} />
    </>
  );
};
