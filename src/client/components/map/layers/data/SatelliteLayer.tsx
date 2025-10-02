import useAPI from "@/hooks/useAPI";
import RasterDataLayer from "../base/RasterData";
import { EndpointUrls, RasterLayerData } from "@/lib/types";
import { useSatelliteProduct, useShowSatellite } from "@/stateStores/map/rasterData";
import { useMapRef } from "@/stateStores/map/mapView";
import { SatelliteDomains } from "@shared/lib/types";

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

  const { data: satelliteData } = useAPI<RasterLayerData[]>(endpoint, queryParams, {
    queryName: `${satelliteDomain}SatelliteData`,
    enabled,
    interval: 1,
  });

  if (!enabled || satelliteData?.status !== "success") return;

  return <RasterDataLayer apiData={satelliteData.data[0]} belowLayer={belowLayerId} />;
};
