import type { SatelliteDomains } from "@shared/lib/types";
import RasterDataLayer from "../base/RasterData";
import { useSatelliteProduct, useShowSatellite } from "@/stateStores/map/rasterData";
import { useMapRef } from "@/stateStores/map/mapView";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";
import { MINUTE } from "@shared/lib/constants";

interface Props {
  belowLayer?: string;
  domain: SatelliteDomains;
}

export const SatelliteLayer = ({ belowLayer = "layer-radar-national-18", domain }: Props) => {
  const enabled = useShowSatellite();
  const satelliteProduct = useSatelliteProduct();
  const mapRef = useMapRef();

  const satelliteDomain =
    domain === "europe"
      ? domain.charAt(0).toUpperCase() + domain.slice(1)
      : domain === "west"
        ? "GOES-West"
        : "GOES-East";

  const belowLayerId = mapRef?.getLayer(belowLayer) ? belowLayer : "wateroutline";

  const queryParams =
    domain === "europe" ? { layers: "mtg_fd:rgb_cloudphase" } : { layers: `${satelliteDomain}_${satelliteProduct}` };

  const { data } = useQuery(
    api.wms[domain === "europe" ? "eumetsat" : "geomet"].queryOptions(queryParams, {
      enabled,
      placeholderData: keepPreviousData,
      refetchInterval: MINUTE,
    }),
  );

  if (!enabled || !data) return;

  return <RasterDataLayer apiData={data[0]} belowLayer={belowLayerId} />;
};
