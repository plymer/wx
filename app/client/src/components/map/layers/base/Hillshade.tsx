import { useBaseMap } from "@/stateStores/map/mapView";
import { useShowSatellite } from "@/stateStores/map/rasterData";
import { Source, Layer } from "react-map-gl/maplibre";

export const HillshadeLayer = () => {
  const baseMap = useBaseMap();
  const showSatellite = useShowSatellite();
  const enabled = !showSatellite && (baseMap === "hillshade" || baseMap === "liberty");

  if (!enabled) return null;

  return (
    <Source id="hillshade" type="raster-dem" url="https://tiles.mapterhorn.com/tilejson.json" minzoom={5} maxzoom={13}>
      <Layer
        id="hillshade-layer"
        key="hillshade-layer"
        type="hillshade"
        source="hillshade"
        beforeId="satellite-target"
        paint={{
          "hillshade-exaggeration": ["interpolate", ["linear"], ["zoom"], 5, 0, 13, 0.5],
          "hillshade-highlight-color": baseMap === "hillshade" ? "#000" : "#fffa",
          "hillshade-shadow-color": baseMap === "hillshade" ? "#444" : "#9993",
          "hillshade-illumination-direction": 135,
        }}
      />
    </Source>
  );
};
