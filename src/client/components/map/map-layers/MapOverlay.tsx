import {
  CircleLayerSpecification,
  FillLayerSpecification,
  Layer,
  LineLayerSpecification,
  Source,
  SymbolLayerSpecification,
} from "react-map-gl/maplibre";

import { FeatureCollection } from "geojson";

interface Props {
  overlayId: string; // optional id for the overlay, useful for debugging
  data: FeatureCollection;
  overlayOptions: SymbolLayerSpecification | LineLayerSpecification | CircleLayerSpecification | FillLayerSpecification;
}

const MapOverlay = ({ overlayId, data, overlayOptions }: Props) => {
  // const layout = overlayOptions?.layout ?? {};
  // const paint = overlayOptions?.paint ?? {};
  return (
    <>
      <Source type="geojson" data={data} id={overlayId}>
        <Layer beforeId="boundary_state" {...overlayOptions} id={overlayId} />
      </Source>
    </>
  );
};

export default MapOverlay;
