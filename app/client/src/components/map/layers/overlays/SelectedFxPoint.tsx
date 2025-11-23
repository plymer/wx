import type { FeatureCollection } from "geojson";

import { Source, Layer } from "react-map-gl/maplibre";

interface Props {
  data: FeatureCollection;
}

export const SelectedFxPoint = ({ data }: Props) => {
  return (
    <Source id="currentLocationSelected" type="geojson" data={data}>
      <Layer
        id="currentLocationSelectedIndicator"
        type="circle"
        paint={{
          "circle-radius": 8,
          "circle-color": "#ff00aa",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        }}
      />
      <Layer
        id="currentLocationSelectedText"
        type="symbol"
        paint={{
          "text-color": "#000000",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        }}
        layout={{
          "text-field": "Forecast Location",
          "text-size": 14,
          "text-radial-offset": 1,
          "text-anchor": "top-left",
          "text-allow-overlap": true,
        }}
      />
    </Source>
  );
};
