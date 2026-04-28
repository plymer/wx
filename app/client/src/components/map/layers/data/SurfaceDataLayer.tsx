import { useDisplayTime } from "@/hooks/useDisplayTime";

import { useViewportBounds, useZoom } from "@/stateStores/map/mapView";

import { useFrame } from "@/stateStores/map/animation";
import { Isobars } from "./sfc-data/Isobars";
import { Isotherms } from "./sfc-data/Isotherms";
import { Isodrosotherms } from "./sfc-data/Isodrosotherms";
import { Popups } from "./sfc-data/Popups";
import { Plots } from "./sfc-data/Plots";

export const SurfaceDataLayer = () => {
  const zoom = useZoom();
  const viewport = useViewportBounds();
  const currentFrame = useFrame();
  const displayTime = useDisplayTime();

  return (
    <>
      <Isodrosotherms currentFrame={currentFrame} />
      <Isotherms currentFrame={currentFrame} />
      <Isobars currentFrame={currentFrame} displayTime={displayTime} />
      <Plots viewport={viewport} displayTime={displayTime} zoom={zoom} />
      <Popups zoom={zoom} />
    </>
  );
};
