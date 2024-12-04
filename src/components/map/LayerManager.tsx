import { useGeoMetContext } from "@/contexts/geometContext";
import GeoMetLayer from "./GeoMetLayer";
import RasterDataLayer from "./RasterDataLayer";
import useMapConfig from "@/hooks/useMapConfig";
import { useEffect, useState } from "react";
import useAPI from "@/hooks/useAPI";
import { GeoMetData, LayerData, MapLayerConfig } from "@/lib/types";

interface Props {
  config: MapLayerConfig;
  baseLayers: string[];
}

type LayerConstraints = {
  vector: string;
  raster: string;
};

function generateLayerId(type: string, domain: string) {
  return `layer-${type}-${domain}`;
}

const LayerManager = ({ config, baseLayers }: Props) => {
  const [layerConfig, setLayerConfig] = useState<MapLayerConfig>();
  const [layerConstraints, setLayerConstraints] = useState<LayerConstraints | undefined>({
    vector: baseLayers[baseLayers.length - 1],
    raster: baseLayers[0],
  });
  const [apiRasterData, setApiRasterData] = useState<LayerData[]>();

  const { data: rasterData, fetchStatus: rasterFetchStatus } = useAPI<GeoMetData>("geomet", [
    {
      param: "layers",
      value: "RADAR_1KM_RRAI,GOES-West_1km_DayCloudType-NightMicrophysics,GOES-East_1km_DayCloudType-NightMicrophysics",
    },
  ]);

  useEffect(() => {
    if (!config) return;

    setLayerConfig(config);

    return () => {
      setLayerConfig(undefined);
    };
  }, [config]);

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

  const geoMet = useGeoMetContext();

  const mapConfig = useMapConfig();

  return (
    <>
      {apiRasterData?.map((d, i) => (
        <div key={i}>
          {d.type === "satellite" ? (
            <RasterDataLayer
              key={`satellite${i}`}
              type="satellite"
              product={geoMet.satelliteProduct}
              domain={d.domain}
              belowLayer={
                i === 0
                  ? layerConstraints?.raster
                  : generateLayerId(apiRasterData[i - 1].type, apiRasterData[i - 1].domain) + "-0"
              }
            />
          ) : (
            ""
          )}
          {d.type === "radar" ? (
            <RasterDataLayer
              key={`radar${i}`}
              type="radar"
              product={geoMet.radarProduct}
              domain={d.domain}
              belowLayer={
                i === 0
                  ? layerConstraints?.raster
                  : generateLayerId(apiRasterData[i - 1].type, apiRasterData[i - 1].domain) + "-0"
              }
            />
          ) : (
            ""
          )}
        </div>
      ))}
      {/* {config.wms.map((d, i) => (
        <GeoMetLayer key={i} type="satellite" product={geoMet.satelliteProduct} domain={d} belowLayer="wateroutline" />
      ))} */}
    </>
  );
};

export default LayerManager;
