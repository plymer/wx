import useAPI from "@/hooks/useAPI";
import type { EndpointUrls } from "@/lib/types";
import type { SatelliteDomains, WMSLayer } from "@shared/lib/types";
import RasterDataLayer from "../base/RasterData";
import { useSatelliteProduct, useShowSatellite } from "@/stateStores/map/rasterData";
import { useMapRef } from "@/stateStores/map/mapView";

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

  const endpoint: EndpointUrls = domain === "europe" ? "/eumetsat" : "/geomet";

  const { data: satelliteData } = useAPI<WMSLayer[]>(endpoint, queryParams, {
    queryName: `${satelliteDomain}SatelliteData`,
    enabled,
    interval: 1,
  });

  if (!enabled || satelliteData?.status !== "success") return;

  return <RasterDataLayer apiData={satelliteData.data[0]} belowLayer={belowLayerId} />;
};
