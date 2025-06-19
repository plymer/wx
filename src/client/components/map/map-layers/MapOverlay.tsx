import {
  CircleLayerSpecification,
  FillLayerSpecification,
  Layer,
  LineLayerSpecification,
  Source,
  SourceSpecification,
  SymbolLayerSpecification,
  VectorSourceSpecification,
} from "react-map-gl/maplibre";

import { FeatureCollection } from "geojson";

interface Props {
  data: FeatureCollection;
  overlayOptions: SymbolLayerSpecification | LineLayerSpecification | CircleLayerSpecification | FillLayerSpecification;
}

const MapOverlay = ({ data, overlayOptions }: Props) => {
  const layout = overlayOptions?.layout ?? {};
  const paint = overlayOptions?.paint ?? {};
  return (
    <>
      <Source type="geojson" data={data}>
        <Layer beforeId="boundary_state" {...overlayOptions} />
      </Source>
    </>
  );
};

export default MapOverlay;
