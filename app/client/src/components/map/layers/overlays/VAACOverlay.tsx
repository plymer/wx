import MapOverlay from "../base/MapOverlay";
import { useVAACOverlay } from "@/stateStores/map/overlays";
import vaacBoundaries from "@/assets/general-overlays/vaac-boundaries.json";
import type { FeatureCollection } from "geojson";

export const VAACOverlay = () => {
  const enabled = useVAACOverlay();

  if (!enabled) return;

  const data = vaacBoundaries as FeatureCollection;

  return (
    <>
      <MapOverlay
        overlayId="vaac-boundaries-underlay"
        key="vaac-boundaries-underlay"
        data={data}
        belowLayer="water_name"
        overlayOptions={{
          id: "vaac-boundaries-underlay",
          type: "line",
          source: "vaac-boundaries-underlay",
          paint: { "line-color": "black", "line-width": 8 },
        }}
      />

      <MapOverlay
        overlayId="vaac-boundaries"
        key="vaac-boundaries"
        data={data}
        belowLayer="water_name"
        overlayOptions={{
          id: "vaac-boundaries",
          type: "line",
          source: "vaac-boundaries",
          paint: { "line-color": "red", "line-width": 4 },
        }}
      />
      <MapOverlay
        overlayId="vaac-boundaries-name"
        key="vaac-boundaries-name"
        data={data}
        belowLayer="water_name"
        overlayOptions={{
          id: "vaac-boundaries-name",
          type: "symbol",
          source: "vaac-boundaries-name",
          paint: { "text-color": "white", "text-halo-color": "black", "text-halo-width": 2 },
          layout: {
            "text-field": ["concat", "VAAC ", ["get", "vaac"]],
            "symbol-placement": "line",
            "text-offset": [0, 1],
            "symbol-spacing": 800,
          },
        }}
      />
    </>
  );
};
