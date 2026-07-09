import { GEOMET_ATTRIBUTION } from "@/config/rasterData";
import { AWC_ATTRIBUTION } from "@/config/vectorData";
import { useTileUrl } from "@/hooks/useTileUrl";
import { Source } from "react-map-gl/maplibre";

export const VectorTileSource = () => {
  const tileUrl = useTileUrl();

  return (
    <Source
      key="vec-tile-source"
      id="vector-tile-source"
      type="vector"
      tiles={[tileUrl]}
      attribution={[GEOMET_ATTRIBUTION, AWC_ATTRIBUTION].join(" | ")}
    />
  );
};
