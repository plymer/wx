import useAPI from "@/hooks/useAPI";
import RasterDataLayer from "../base/RasterData";
import { WMSLayer } from "@shared/lib/types";
import { useRadarProduct, useShowRadar } from "@/stateStores/map/rasterData";
import { useMapRef } from "@/stateStores/map/mapView";

interface Props {
  belowLayer?: string;
}

export const RadarLayer = ({ belowLayer = "wateroutline" }: Props) => {
  const enabled = useShowRadar();
  const radarProduct = useRadarProduct();
  const mapRef = useMapRef();

  const belowLayerId = mapRef?.getLayer(belowLayer) ? belowLayer : "wateroutline";

  const { data: radarData } = useAPI<WMSLayer[]>(
    "/geomet",
    {
      layers: radarProduct,
    },
    {
      queryName: "radarData",
      enabled,
      interval: 1,
    },
  );

  if (!enabled || radarData?.status !== "success") return;

  return <RasterDataLayer apiData={radarData.data[0]} belowLayer={belowLayerId} />;
};
