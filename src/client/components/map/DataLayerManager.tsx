// third-party libraries
import { useEffect, useState } from "react";

// types, utilities, and hooks
import { RasterLayerData, GeoJSON } from "../../lib/types";
// import { MINUTE, tempCircleBuilder } from "@/lib/utils";

// data layers
import RasterDataLayer from "./map-layers/RasterDataLayer";
// import VectorDataLayer from "./map-layers/VectorDataLayer";
// import SurfaceData from "./map-layers/SurfaceData";
// import PirepData from "./map-layers/PirepData";

// configuration
import { SATELLITES } from "../../config/map";

// state management
import {
  useRadarProduct,
  useRasterManifest,
  useRasterStateActions,
  useSatelliteProduct,
  useShowRadar,
  useShowSatellite,
} from "../../stateStores/map/rasterData";
import useAPI from "../../hooks/useAPI";
// import { useShowObs, useShowPIREPs, useShowSIGMETs, useShowAIRMETs } from "@/stateStores/vectorData";
// import { useDeltaTime, useFrame, useStartTime } from "../../stateStores/map/animation";
// import { useViewportBounds, useZoom } from "../../stateStores/map/mapView";

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

const DataLayerManager = ({ baseLayers }: Props) => {
  // surface data state for the single session
  // const [newestMetar, setNewestMetar] = useState<number | undefined>(undefined);
  // const [metarData, setMetarData] = useState<GeoJSON | undefined>(undefined);

  // state store subscriptions

  // const vector = {
  //   // showLightning: useShowLightning(),
  //   showObs: useShowObs(),
  //   showPIREPs: useShowPIREPs(),
  //   showSIGMETs: useShowSIGMETs(),
  //   showAIRMETs: useShowAIRMETs(),
  // };

  const raster = {
    showSatellite: useShowSatellite(),
    showRadar: useShowRadar(),
    satelliteProduct: useSatelliteProduct(),
    radarProduct: useRadarProduct(),
    manifest: useRasterManifest(),
  };

  // const animation = { frame: useFrame(), startTime: useStartTime(), deltaTime: useDeltaTime() };

  // const map = { zoom: useZoom(), bounds: useViewportBounds() };

  const rasterActions = useRasterStateActions();

  // computed state
  // const currentTime = animation.deltaTime * animation.frame + animation.startTime;

  // this is a list of the WMS layer names that are requested from the API
  const [rasterSearchString, setRasterSearchString] = useState<string>();

  // set the layers for drawing logic - vector must be the highest basemap layer and raster the lowest
  const layerConstraints: LayerConstraints | undefined = {
    vector: baseLayers[baseLayers.length - 1],
    raster: baseLayers[0],
  };

  // data fetching
  const { data: rasterData } = useAPI<RasterLayerData[]>(
    "/geomet",
    {
      layers: rasterSearchString,
    },
    {
      queryName: "rasterData",
      enabled: true,
      interval: 1,
    }
  );

  // const { data: sigmets } = useAPI<GeoJSON>(
  //   "/alpha/sigmets",
  //   { format: "geojson", hours: 6 },
  //   { queryName: "sigmets", enabled: true, interval: 1 }
  // );

  // const { data: airmets } = useAPI<GeoJSON>(
  //   "/alpha/airmets",
  //   { format: "geojson", hours: 6 },
  //   { queryName: "airmets", enabled: true, interval: 1 }
  // );

  // create a search string to query the API any time our satellite channels or radar product changes
  useEffect(() => {
    let search = [
      raster.showRadar ? raster.radarProduct : undefined,
      raster.showSatellite ? SATELLITES.map((s) => `${s}_${raster.satelliteProduct}`).toString() : undefined,
    ].toString();

    // do some string sanitization so that we don't have any leading or trailing commas
    if (search.charAt(search.length - 1) === ",") search = search.slice(0, search.length - 1);
    if (search.charAt(0) === ",") search = search.slice(1, search.length);

    setRasterSearchString(search);

    return () => setRasterSearchString(undefined);
  }, [raster.radarProduct, raster.showRadar, raster.satelliteProduct, raster.showSatellite]);

  // update the list of raster layerIds whenever we have stored new data from API
  useEffect(() => {
    if (!rasterData || !rasterData.data || rasterData.data.length === 0) return;
    rasterActions.setManifest(rasterData.data.map((d) => generateLayerId(d.type, d.domain)));

    return () => rasterActions.setManifest([]);
  }, [rasterData]);

  // draw the layers if we have a list of layerIds and we aren't in the middle of toggling on/off a data layer
  return (
    <>
      {raster.manifest &&
        rasterData?.data?.map((d, i) => {
          const belowLayerId = i === 0 ? layerConstraints.raster : raster.manifest[i - 1] + "-0";

          return (
            <RasterDataLayer
              key={d.domain}
              apiData={d}
              {...(i === 0 || raster.manifest[i - 1] ? { belowLayer: belowLayerId } : {})}
            />
          );
        })}
      {/* {vector.showObs && (
        <SurfaceData
          key={"sfc-data"}
          setNewestMetar={setNewestMetar}
          setMetarData={setMetarData}
          newestMetar={newestMetar}
          metarData={metarData}
          currentTime={currentTime}
          startTime={animation.startTime}
          zoomLevel={map.zoom}
          viewportBounds={map.bounds}
        />
      )} */}

      {/* {vector.showSIGMETs && sigmets && (
        <VectorDataLayer key={"sigmet"} dataType="sigmet" jsonData={sigmets} belowLayer={layerConstraints.vector} />
      )} */}

      {/* {vector.showAIRMETs && airmets && (
        <VectorDataLayer key={"airmet"} dataType="airmet" jsonData={airmets} belowLayer={layerConstraints.vector} />
      )} */}

      {/* {vector.showPIREPs && <PirepData key={"pirep"} currentTime={currentTime} viewportBounds={map.bounds} />} */}

      {/* {vectorDataStore.showLightning && dummyLightning && (
        <VectorDataLayer
          dataType="lightning"
          key={"lightning"}
          jsonData={{ status: "success", data: dummyLightning }}
          belowLayer={layerConstraints.vector}
        />
      )} */}
    </>
  );
};

export default DataLayerManager;
