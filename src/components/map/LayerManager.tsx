import { useGeoMetContext } from "@/contexts/geometContext";
import GeoMetLayer from "./GeoMetLayer";
import RasterDataLayer from "./RasterDataLayer";
import useMapConfig from "@/hooks/useMapConfig";
import { useEffect, useState } from "react";
import useAPI from "@/hooks/useAPI";
import { GeoMetData } from "@/lib/types";

interface Props {
  config: Object;
  baseLayers: string[];
}

type LayerConstraints = {
  vector: string;
  raster: string;
};

const LayerManager = ({ config, baseLayers }: Props) => {
  const [layerConstraints, setLayerConstraints] = useState<LayerConstraints>();
  const [apiRasterData, setApiRasterData] = useState<GeoMetData>();

  const { data: rasterData, fetchStatus: rasterFetchStatus } = useAPI<GeoMetData>("geomet", [
    { param: "layers", value: "all" },
  ]);

  useEffect(() => {
    if (!baseLayers) return;
    setLayerConstraints({ vector: baseLayers[baseLayers.length - 1], raster: baseLayers[0] });

    return () => {
      setLayerConstraints(undefined);
    };
  }, [baseLayers]);

  useEffect(() => {
    setApiRasterData(rasterData);

    return () => {
      setApiRasterData(undefined);
    };
  }, [rasterFetchStatus]);

  console.log(apiRasterData);

  const geoMet = useGeoMetContext();

  const mapConfig = useMapConfig();

  // config.wms.map((d) => console.log(d));

  return (
    <>
      {config.raster.map((d, i) => (
        <RasterDataLayer
          key={i}
          type="satellite"
          product={geoMet.satelliteProduct}
          domain={d}
          belowLayer="wateroutline"
        />
      ))}
      {/* {config.wms.map((d, i) => (
        <GeoMetLayer key={i} type="satellite" product={geoMet.satelliteProduct} domain={d} belowLayer="wateroutline" />
      ))} */}
    </>
  );
};

export default LayerManager;
