import { Layer, Source } from "react-map-gl/maplibre";

import { GeoJSON, OverlayOptions } from "../../../lib/types";

interface Props {
  id: string;
  data: GeoJSON;
  overlayType: "circle" | "line" | "fill" | "symbol";
  overlayOptions?: OverlayOptions;
}

const MapOverlay = ({ id, overlayType, data, overlayOptions }: Props) => {
  const layout = overlayOptions?.layout ?? {};
  const paint = overlayOptions?.paint ?? {};
  return (
    <>
      {/* @ts-ignore */}
      <Source type="geojson" data={data}>
        <Layer type={overlayType} id={id} beforeId="boundary_state" layout={layout} paint={paint} />
      </Source>
    </>
  );
};

export default MapOverlay;
