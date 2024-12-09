import RasterDataLayer from "./RasterDataLayer";

import { useEffect, useState } from "react";
import useAPI from "@/hooks/useAPI";
import { GeoMetData, LayerData } from "@/lib/types";
import { useMapConfigContext } from "@/contexts/mapConfigContext";
import { SATELLITES } from "@/config/satellite";

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

const LayerManager = ({ baseLayers }: Props) => {
  const mapConfig = useMapConfigContext();

  const [layersChanging, setLayersChanging] = useState<boolean>(true);

  // this is passed to the api endpoint as a searchParam value (comma-separated)
  const [rasterSearchString, setRasterSearchString] = useState<string>();
  // this keeps track of the layerIds for each raster dataset being shown on the map
  const [rasterLayerManifest, setRasterLayerManifest] = useState<string[]>();

  // set the layers for drawing logic - vector must be the highest basemap layer and raster the lowest
  const [layerConstraints, setLayerConstraints] = useState<LayerConstraints | undefined>({
    vector: baseLayers[baseLayers.length - 1],
    raster: baseLayers[0],
  });
  // keep track of the api raster data response
  const [apiRasterData, setApiRasterData] = useState<LayerData[]>();

  // data fetching
  const { data: rasterData, fetchStatus: rasterFetchStatus } = useAPI<GeoMetData>("geomet", [
    {
      param: "layers",
      value: rasterSearchString,
    },
    {
      param: "frames",
      value: mapConfig.frameCount,
    },

    {
      param: "mode",
      value: mapConfig.animationState !== "stopped" ? "loop" : "",
    },
  ]);

  useEffect(() => {
    let search = [
      mapConfig.showRadar ? mapConfig.radarProduct : undefined,
      mapConfig.showSatellite ? SATELLITES.map((s) => `${s}_${mapConfig.satelliteProduct}`).toString() : undefined,
    ].toString();

    // do some string sanitization so that we don't have any leading or trailing commas
    if (search.charAt(search.length - 1) === ",") search = search.slice(0, search.length - 1);
    if (search.charAt(0) === ",") search = search.slice(1, search.length);

    // console.log(search);

    setLayersChanging(true);
    setRasterSearchString(search);

    return () => {
      setLayersChanging(false);
      setRasterSearchString(undefined);
    };
  }, [mapConfig.showRadar, mapConfig.radarProduct, mapConfig.showSatellite, mapConfig.satelliteProduct]);

  useEffect(() => {
    if (!baseLayers) return;
    setLayerConstraints({ vector: baseLayers[baseLayers.length - 1], raster: baseLayers[0] });

    return () => {
      setLayerConstraints(undefined);
    };
  }, [baseLayers]);

  useEffect(() => {
    if (!rasterData?.layers && !rasterData?.metadata) return;
    setApiRasterData(rasterData.layers);
    mapConfig.setEndTime(rasterData.metadata.end);
    mapConfig.setStartTime(rasterData.metadata.start);
    mapConfig.setTimeStep(rasterData.metadata.delta);

    return () => {
      setApiRasterData(undefined);
    };
  }, [rasterFetchStatus]);

  useEffect(() => {
    if (!apiRasterData) return;
    setRasterLayerManifest(apiRasterData.map((d) => generateLayerId(d.type, d.domain)));
    setLayersChanging(false);

    return () => {
      setLayersChanging(true);
      setRasterLayerManifest(undefined);
    };
  }, [apiRasterData]);

  return (
    rasterLayerManifest &&
    !layersChanging && (
      <>
        {apiRasterData?.map((d, i) => (
          <div key={i}>
            {d.type === "satellite" && mapConfig.showSatellite && (
              <>
                <RasterDataLayer
                  key={`raster-${i}`}
                  apiData={d}
                  belowLayer={i === 0 ? layerConstraints?.raster : rasterLayerManifest[i - 1] + "-0"}
                />
              </>
            )}
            {d.type === "radar" && mapConfig.showRadar && (
              <RasterDataLayer
                key={`raster-${i}`}
                apiData={d}
                belowLayer={i === 0 ? layerConstraints?.raster : rasterLayerManifest[i - 1] + "-0"}
              />
            )}
          </div>
        ))}
      </>
    )
  );
};

export default LayerManager;
