import type { RasterSource } from "@vis.gl/react-maplibre";
import { Layer, Source } from "@vis.gl/react-maplibre";

import { LayerData } from "@/lib/types";
import { useAnimation } from "@/stateStores/map/animation";
import { GEOMET_GETMAP, GOES_EAST_BOUNDS, GOES_WEST_BOUNDS, MAP_BOUNDS } from "@/config/map";

interface Props {
  belowLayer?: string;
  apiData: LayerData;
}

const RasterDataLayer = ({ belowLayer, apiData }: Props) => {
  const frame = useAnimation((state) => state.frame);
  const animationState = useAnimation((state) => state.state);

  const layerId = "layer-" + apiData.type + "-" + apiData.domain;

  const source: RasterSource = {
    type: "raster",
    tileSize: 256,
    bounds:
      apiData.type === "satellite" ? (apiData.domain === "west" ? GOES_WEST_BOUNDS : GOES_EAST_BOUNDS) : MAP_BOUNDS,
  };

  /*
  rules for smooth animation:
   1. absolutely NO tile source must change, otherwise the layer will dump the previous tiles and re-initialize new ones, leading to the checkerboard pattern and a poor UX. i do not believe this behaviour can be changed as it is inherent in both mapbox and maplibre.

  2. the previous frame must be rendered under the current frame in order to prevent the flickering of layers due to an inherent, unchangeable (as of 2024-09-02) 300ms fadeout for each layer. the property "raster-fade-duration" does not do anything as of this time.

  THE PROBLEM::
  - we are having a poor UX with this implementation because it is drawing the Zero'th layer first as it is loading all of the sources, which is fine if you are looking at 3-hour-old data by default
  - we need to figure out how to re-order the layers such that the animation.frameCount - 1'th layer is drawn at the top and updates first

  */

  if (apiData) {
    if (animationState === "stopped") {
      // console.log("not playing!");
      return (
        <Source
          {...source}
          id={layerId + "-0"}
          key="0"
          tiles={[GEOMET_GETMAP + apiData.name + "&time=" + apiData.timeSteps[frame]]}
        >
          <Layer type="raster" source="source" id={layerId + "-0"} beforeId={belowLayer} />
        </Source>
      );
    } else {
      // console.log("playing!");
      return apiData.timeSteps.map((u, index) => (
        <Source
          {...source}
          key={index}
          tiles={[GEOMET_GETMAP + apiData.name + "&time=" + u]}
          id={layerId + "-" + index}
        >
          <Layer
            type="raster"
            source="source"
            id={layerId + "-" + index}
            beforeId={belowLayer}
            paint={{
              "raster-fade-duration": 0, // this literally doesn't do anything
              "raster-opacity":
                index === frame || index === frame - 1 || (apiData.type === "satellite" && index === 0) ? 1 : 0, // here, we want the current, the previous, and the very last frame to be preserved so that we don't get any flickering of the map background since the renderer does not repsect our fade-duration property
            }}
          />
        </Source>
      ));
    }
  }
};

export default RasterDataLayer;
