import { useBaseMap } from "@/stateStores/map/mapView";
import { useShowSatellite } from "@/stateStores/map/rasterData";
import { Source, Layer } from "react-map-gl/maplibre";

export const HillshadeLayer = () => {
  const baseMap = useBaseMap();
  const showSatellite = useShowSatellite();
  const enabled = !showSatellite && baseMap === "hillshade";

  if (!enabled) return null;

  return (
    <Source id="hillshade" type="raster-dem" url="https://tiles.mapterhorn.com/tilejson.json" maxzoom={13}>
      <Layer
        id="hillshade-layer"
        key="hillshade-layer"
        type="hillshade"
        source="hillshade"
        beforeId="satellite-target"
        paint={{
          "hillshade-highlight-color": "#000",
          "hillshade-shadow-color": "#444",
          "hillshade-illumination-direction": 135,
        }}
      />
    </Source>
  );
};
