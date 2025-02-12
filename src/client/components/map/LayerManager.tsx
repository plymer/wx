// third-party libraries
import { useEffect, useState } from "react";

// types and hooks

// data layers
import RasterDataLayer from "./data-layers/RasterDataLayer";

// configuration

// state management
import { useAnimation } from "../../stateStores/map/animation";
import { useRasterData } from "../../stateStores/map/rasterData";
import { GeoMetData, LayerData } from "../../lib/types";
import { SATELLITES } from "../../config/map";
import useAPI from "../../hooks/useAPI";

interface Props {
  baseLayers: string[];
}

type LayerConstraints = {
  vector: string;
  raster: string;
};

function generateLayerId(type: string, domain: string) {
  return `layer-${type}-${domain}`;
}

/*

need to look into how to pause/queue the loading of the next layer in the manager until the previous layer has been loaded

*/

const LayerManager = ({ baseLayers }: Props) => {
  const animation = useAnimation();
  const rasterDataStore = useRasterData();

  // controls when the map re-initialzes its layers
  const [layersChanging, setLayersChanging] = useState<boolean>(true);

  // this is passed to the api endpoint as a searchParam value (comma-separated)
  const [rasterSearchString, setRasterSearchString] = useState<string>();

  // keep track of the api raster data response
  const [apiRasterData, setApiRasterData] = useState<LayerData[]>();

  // set the layers for drawing logic - vector must be the highest basemap layer and raster the lowest
  const layerConstraints: LayerConstraints | undefined = {
    vector: baseLayers[baseLayers.length - 1],
    raster: baseLayers[0],
  };

  // we want to store the status of each layer type so we know whether to add it to the map yet
  // const layerStatus = [
  //   { layer: "satellite", isPending: false },
  //   { layer: "radar", isPending: false },
  // ];

  const params = {
    layers: rasterSearchString,
    frames: animation.frameCount,
    mode: animation.state !== "stopped" ? "loop" : "current",
  };

  // data fetching
  const { data: rasterData, fetchStatus: rasterFetchStatus } = useAPI<GeoMetData>("/geomet", params, {
    queryName: "geomet",
  });

  // const vectorData: VectorDataList = {
  //   lightning: geoJson,
  // };

  // create a search string to query the API any time our satellite channels or radar product changes
  useEffect(() => {
    let search = [
      rasterDataStore.showRadar ? rasterDataStore.radarProduct : undefined,
      rasterDataStore.showSatellite
        ? SATELLITES.map((s) => `${s}_${rasterDataStore.satelliteProduct}`).toString()
        : undefined,
    ].toString();

    // do some string sanitization so that we don't have any leading or trailing commas
    if (search.charAt(search.length - 1) === ",") search = search.slice(0, search.length - 1);
    if (search.charAt(0) === ",") search = search.slice(1, search.length);

    setRasterSearchString(search);

    return () => {
      setRasterSearchString(undefined);
    };
  }, [rasterDataStore.radarProduct, rasterDataStore.satelliteProduct, layersChanging]);

  // for the map to release all of our raster data layers so we can
  //   re-order them whenever we turn on/off a raster layer
  useEffect(() => {
    setLayersChanging(true);

    return () => {
      setLayersChanging(false);
    };
  }, [rasterDataStore.showRadar, rasterDataStore.showSatellite]);

  // store the raster layer data for later use, and update the mapConfig animation settings whenever
  //   the API returns new data
  useEffect(() => {
    if (!rasterData?.layers && !rasterData?.timesAvailable && !rasterData?.timeStep) return;
    setApiRasterData(rasterData.layers);
    animation.setEndTime(rasterData.timesAvailable[animation.frameCount - 1]);
    animation.setStartTime(rasterData.timesAvailable[0]);
    animation.setDeltaTime(rasterData.timeStep);

    return () => {
      setApiRasterData([]);
    };
  }, [rasterFetchStatus]);

  // update the list of raster layerIds whenever we have stored new data from API
  useEffect(() => {
    if (!apiRasterData) return;
    rasterDataStore.setManifest(apiRasterData.map((d) => generateLayerId(d.type, d.domain)));
    setLayersChanging(false);

    return () => {
      setLayersChanging(true);
    };
  }, [apiRasterData]);

  // draw the layers if we have a list of layerIds and we aren't in the middle of toggling on/off a data layer
  return (
    <>
      {rasterDataStore.manifest && !layersChanging && (
        <>
          {apiRasterData?.map((d, i) => (
            <div key={i}>
              {d.type === "satellite" && rasterDataStore.showSatellite && (
                <RasterDataLayer
                  key={`raster-${i}`}
                  apiData={d}
                  belowLayer={i === 0 ? layerConstraints?.raster : rasterDataStore.manifest[i - 1] + "-0"}
                />
              )}
              {d.type === "radar" && rasterDataStore.showRadar && (
                <RasterDataLayer
                  key={`raster-${i}`}
                  apiData={d}
                  belowLayer={i === 0 ? layerConstraints?.raster : rasterDataStore.manifest[i - 1] + "-0"}
                />
              )}
            </div>
          ))}
        </>
      )}
      {/* {vectorDataStore.showLightning && (
        <VectorDataLayer dataType="lightning" jsonData={vectorData["lightning"]} belowLayer={layerConstraints.vector} />
      )} 
       {vectorDataStore.showObs && (
        <VectorDataLayer
          dataType="surfaceObs"
          jsonData={vectorData["surfaceObs"]}
          belowLayer={layerConstraints.vector}
        />
      )}
      {vectorDataStore.showAIRMETs && (
        <VectorDataLayer dataType="airmets" jsonData={vectorData["airmets"]} belowLayer={layerConstraints.vector} />
      )}
      {vectorDataStore.showSIGMETs && (
        <VectorDataLayer dataType="sigmets" jsonData={vectorData["sigmets"]} belowLayer={layerConstraints.vector} />
      )}
      {vectorDataStore.showPIREPs && (
        <VectorDataLayer dataType="pireps" jsonData={vectorData["pireps"]} belowLayer={layerConstraints.vector} />
      )} */}
    </>
  );
};

export default LayerManager;
