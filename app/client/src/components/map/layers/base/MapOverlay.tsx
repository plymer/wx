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
  belowLayer?: string; // the layer to render this overlay below, defaults to "boundary_state"
  data: FeatureCollection;
  overlayOptions: SymbolLayerSpecification | LineLayerSpecification | CircleLayerSpecification | FillLayerSpecification;
}

const MapOverlay = ({ overlayId, data, overlayOptions, belowLayer = "boundary_state" }: Props) => {
  return (
    <>
      <Source type="geojson" data={data} id={overlayId}>
        <Layer beforeId={belowLayer} {...overlayOptions} id={overlayId} />
      </Source>
    </>
  );
};

export default MapOverlay;
