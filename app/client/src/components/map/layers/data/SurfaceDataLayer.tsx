import { useDisplayTime } from "@/hooks/useDisplayTime";

import { useZoom } from "@/stateStores/map/mapView";

import { useFrame } from "@/stateStores/map/animation";
import { Isobars } from "./sfc-data/Isobars";
import { Isotherms } from "./sfc-data/Isotherms";
import { Isodrosotherms } from "./sfc-data/Isodrosotherms";
import { Popups } from "./sfc-data/Popups";
import { Plots } from "./sfc-data/Plots";

export const SurfaceDataLayer = () => {
  const zoom = useZoom();

  const currentFrame = useFrame();
  const displayTime = useDisplayTime();

  return (
    <>
      <Isodrosotherms currentFrame={currentFrame} />
      <Isotherms currentFrame={currentFrame} />
      <Isobars displayTime={displayTime} />
      <Plots displayTime={displayTime} />
      <Popups zoom={zoom} />
    </>
  );
};
