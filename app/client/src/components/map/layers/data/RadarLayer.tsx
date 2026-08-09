import { useRadarProduct, useShowRadar } from "@/stateStores/map/rasterData";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";
import RasterDataLayer from "../base/RasterData";
import { MINUTE } from "@shared/lib/constants";
import { RADAR_BOUNDS } from "@/config/rasterData";
import { useIsVisible } from "@/hooks/useIsVisible";

export const RadarLayer = () => {
  const enabled = useShowRadar();
  const radarProduct = useRadarProduct();

  const isVisible = useIsVisible(RADAR_BOUNDS);

  const belowLayerId = "radar-target";

  const { data } = useQuery(
    api.wms.radar.queryOptions(
      { product: radarProduct },
      { enabled: enabled && isVisible, refetchInterval: MINUTE, trpc: { context: { skipBatch: true } } },
    ),
  );

  if (!isVisible || !enabled || !data) return;

  return <RasterDataLayer apiData={data} belowLayer={belowLayerId} />;
};
