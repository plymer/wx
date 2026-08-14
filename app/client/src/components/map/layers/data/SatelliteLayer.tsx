import type { SatelliteDomains } from "@shared/lib/types";
import RasterDataLayer from "../base/RasterData";
import { useSatelliteProduct, useShowSatellite } from "@/stateStores/map/rasterData";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";
import { MINUTE } from "@shared/lib/constants";
import { SATELLITE_DOMAINS } from "@/config/rasterData";
import { useIsVisible } from "@/hooks/useIsVisible";
import { useBaseMap } from "@/stateStores/map/mapView";

interface Props {
  belowLayer?: string;
  domain: SatelliteDomains;
}

export const SatelliteLayer = ({ domain }: Props) => {
  const showSatellite = useShowSatellite();
  const satelliteProduct = useSatelliteProduct();
  const baseMap = useBaseMap();

  const isVisible = useIsVisible(SATELLITE_DOMAINS[domain]);

  const belowLayerId = "satellite-target";

  // daytime visible product:
  // mtg_fd:rgb_cloudphase
  // night time low cloud/fog product:
  // mtg_fd:rgb_fog

  const { data: euData } = useQuery(
    api.wms.eumetsat.queryOptions(
      { domain: "europe", product: "msg_fes:rgb_ash" },
      {
        enabled: baseMap === "hillshade" && isVisible && showSatellite && domain === "europe",
        refetchInterval: MINUTE,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  const { data: iOData } = useQuery(
    api.wms.eumetsat.queryOptions(
      { domain: "indianOcean", product: "msg_iodc:rgb_ash" },
      {
        enabled: baseMap === "hillshade" && isVisible && showSatellite && domain === "indianOcean",
        refetchInterval: MINUTE,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  const { data: goesData } = useQuery(
    api.wms.goes.queryOptions(
      { domain: domain as "east" | "west", product: satelliteProduct },
      {
        enabled: baseMap === "hillshade" && isVisible && showSatellite && (domain === "east" || domain === "west"),
        refetchInterval: MINUTE,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  const { data: himawariData } = useQuery(
    api.wms.himawari.queryOptions(
      { product: "2km_Ash" },
      {
        enabled: baseMap === "hillshade" && isVisible && showSatellite && domain === "himawari",
        refetchInterval: MINUTE,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  let data;

  switch (domain) {
    case "europe":
      data = euData;
      break;
    case "indianOcean":
      data = iOData;
      break;
    case "west":
    case "east":
      data = goesData;
      break;
    case "himawari":
      data = himawariData;
      break;
  }

  if (baseMap !== "hillshade" || !isVisible || !showSatellite || !data) return;

  return <RasterDataLayer apiData={data} belowLayer={belowLayerId} />;
};
