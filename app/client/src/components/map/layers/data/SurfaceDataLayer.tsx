import { useZoom } from "@/stateStores/map/mapView";

import { Isobars } from "./sfc-data/Isobars";
// import { Isotherms } from "./sfc-data/Isotherms";
// import { Isodrosotherms } from "./sfc-data/Isodrosotherms";
import { Popups } from "./sfc-data/Popups";
import { Plots } from "./sfc-data/Plots";

import { useDisplayTime } from "@/hooks/useDisplayTime";

export const SurfaceDataLayer = () => {
  const zoom = useZoom();

  const frameTime = useDisplayTime();

  return (
    <>
      {/* <Isotherms frameTime={frameTime} /> */}
      <Isobars frameTime={frameTime} />
      <Plots frameTime={frameTime} />
      <Popups zoom={zoom} />
    </>
  );
};
