import { useBaseMap } from "@/stateStores/map/mapView";
import { Source, Layer } from "react-map-gl/maplibre";

export const AerialImageryLayer = () => {
  const baseMap = useBaseMap();
  const enabled = baseMap === "aerial";

  if (!enabled) return null;

  return (
    <Source
      id="aerial-imagery"
      type="raster"
      tiles={["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"]}
      maxzoom={13}
      attribution="<a href='https://goto.arcgisonline.com/maps/World_Imagery'>Esri, Vantor, Earthstar Geographics, and the GIS User Community</a>"
    >
      <Layer id="aerial-imagery-layer" key="aerial-imagery-layer" type="raster" beforeId="satellite-target" />
    </Source>
  );
};
