import { useRadarProduct, useShowRadar } from "@/stateStores/map/rasterData";
import { useMapRef } from "@/stateStores/map/mapView";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";
import RasterDataLayer from "../base/RasterData";
import { MINUTE } from "@shared/lib/constants";

interface Props {
  belowLayer?: string;
}

export const RadarLayer = ({ belowLayer = "wateroutline" }: Props) => {
  const enabled = useShowRadar();
  const radarProduct = useRadarProduct();
  const mapRef = useMapRef();

  const belowLayerId = mapRef?.getLayer(belowLayer) ? belowLayer : "wateroutline";

  // const { data } = useQuery(
  //   api.wms.geomet.queryOptions(
  //     { layer: radarProduct },
  //     { enabled, refetchInterval: MINUTE, trpc: { context: { skipBatch: true } } },
  //   ),
  // );

  const { data } = useQuery(
    api.wms.radar.queryOptions(
      { product: radarProduct },
      { enabled, refetchInterval: MINUTE, trpc: { context: { skipBatch: true } } },
    ),
  );

  if (!enabled || !data) return;

  return <RasterDataLayer apiData={data} belowLayer={belowLayerId} />;
};
