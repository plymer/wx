import { Layer, Source } from "react-map-gl/maplibre";
import type { RasterLayerSpecification, RasterSourceSpecification } from "maplibre-gl";
import { useShowSatellite } from "@/stateStores/map/rasterData";

interface TerrainRGBProps {
  belowLayer?: string;
}

export const TerrainRGB = ({ belowLayer }: TerrainRGBProps) => {
  const showSatellite = useShowSatellite();

  const rasterSource: RasterSourceSpecification = {
    type: "raster",
    maxzoom: 6,
    tileSize: 256,
    tiles: ["https://tiles.openfreemap.org/natural_earth/ne2sr/{z}/{x}/{y}.png"],
  };

  const rasterStyle: RasterLayerSpecification = {
    id: "terrain-raster",
    type: "raster",
    source: "terrain-raster",
    "source-layer": "ne2_shaded",
    maxzoom: 14,
    paint: {
      "raster-opacity": ["interpolate", ["exponential", 1.5], ["zoom"], 0, 1, 6, 0.2],
      "raster-saturation": -1,
      "raster-brightness-max": 0.3,
      "raster-contrast": 0.5,
    },
  };

  // don't render this layer if satellite is enabled
  if (showSatellite) return null;

  return (
    <Source id="terrain-raster" {...rasterSource}>
      <Layer {...rasterStyle} beforeId={belowLayer || "waterfill"} />
    </Source>
  );
};
