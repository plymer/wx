import { useRadarProduct, useShowRadar } from "@/stateStores/map/rasterData";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";
import RasterDataLayer from "../base/RasterData";
import { MINUTE } from "@shared/lib/constants";

export const RadarLayer = () => {
  const enabled = useShowRadar();
  const radarProduct = useRadarProduct();

  const belowLayerId = "radar-target";

  const { data } = useQuery(
    api.wms.radar.queryOptions(
      { product: radarProduct },
      { enabled, refetchInterval: MINUTE, trpc: { context: { skipBatch: true } } },
    ),
  );

  if (!enabled || !data) return;

  return <RasterDataLayer apiData={data} belowLayer={belowLayerId} />;
};
