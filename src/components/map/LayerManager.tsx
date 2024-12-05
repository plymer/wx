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
  ]);

  useEffect(() => {
    console.log("Config has changed, setting search string...");

    let search = [
      mapConfig.radarProduct,
      SATELLITES.map((s) => `${s}_${mapConfig.satelliteProduct}`).toString(),
    ].toString();

    // do some string sanitization so that we don't have any leading or trailing commas
    if (search.charAt(search.length - 1) === ",") search = search.slice(0, search.length - 1);
    if (search.charAt(0) === ",") search = search.slice(1, search.length);

    setRasterSearchString(search);

    return () => {
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
    setApiRasterData(rasterData?.layers);

    return () => {
      setApiRasterData(undefined);
    };
  }, [rasterFetchStatus]);

  useEffect(() => {
    if (!apiRasterData) return;
    setRasterLayerManifest(apiRasterData.map((d) => generateLayerId(d.type, d.domain)));

    return () => {
      setRasterLayerManifest(undefined);
    };
  }, [apiRasterData]);

  if (rasterLayerManifest) {
    return (
      <>
        {apiRasterData?.map((d, i) => (
          <div key={i}>
            {d.type === "satellite" && mapConfig.showSatellite ? (
              <>
                <RasterDataLayer
                  key={`raster-${i}`}
                  apiData={d}
                  belowLayer={i === 0 ? layerConstraints?.raster : rasterLayerManifest[i - 1] + "-0"}
                />
              </>
            ) : (
              ""
            )}
            {d.type === "radar" && mapConfig.showRadar ? (
              <RasterDataLayer
                key={`raster-${i}`}
                apiData={d}
                belowLayer={i === 0 ? layerConstraints?.raster : rasterLayerManifest[i - 1] + "-0"}
              />
            ) : (
              ""
            )}
          </div>
        ))}
      </>
    );
  }
};

export default LayerManager;
