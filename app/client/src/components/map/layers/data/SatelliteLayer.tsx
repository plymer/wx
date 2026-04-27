import type { SatelliteDomains } from "@shared/lib/types";
import RasterDataLayer from "../base/RasterData";
import { useSatelliteProduct, useShowSatellite } from "@/stateStores/map/rasterData";
import { useMapRef } from "@/stateStores/map/mapView";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";
import { MINUTE } from "@shared/lib/constants";

interface Props {
  belowLayer?: string;
  domain: SatelliteDomains;
}

export const SatelliteLayer = ({ belowLayer = "layer-radar-national-18", domain }: Props) => {
  const showSatellite = useShowSatellite();
  const satelliteProduct = useSatelliteProduct();
  const mapRef = useMapRef();

  const belowLayerId = mapRef?.getLayer(belowLayer) ? belowLayer : "wateroutline";

  // daytime visible product:
  // mtg_fd:rgb_cloudphase
  // night time low cloud/fog product:
  // mtg_fd:rgb_fog

  const { data: euData } = useQuery(
    api.wms.eumetsat.queryOptions(
      { domain: "europe", product: "mtg_fd:rgb_fog" },
      {
        enabled: showSatellite && domain === "europe",
        refetchInterval: MINUTE,
      },
    ),
  );

  const { data: iOData } = useQuery(
    api.wms.eumetsat.queryOptions(
      { domain: "indianOcean", product: "msg_iodc:rgb_fog" },
      {
        enabled: showSatellite && domain === "indianOcean",
        refetchInterval: MINUTE,
      },
    ),
  );

  const { data: goesData } = useQuery(
    api.wms.goes.queryOptions(
      { domain: domain as "east" | "west", product: satelliteProduct },
      {
        enabled: showSatellite && domain !== "europe" && domain !== "indianOcean",
        refetchInterval: MINUTE,
      },
    ),
  );

  const data = domain === "europe" ? euData : domain === "indianOcean" ? iOData : goesData;

  if (!showSatellite || !data) return;

  return <RasterDataLayer apiData={data} belowLayer={belowLayerId} />;
};
