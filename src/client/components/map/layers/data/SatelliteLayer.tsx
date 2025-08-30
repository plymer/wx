import useAPI from "@/hooks/useAPI";
import RasterDataLayer from "../base/RasterData";
import { RasterLayerData } from "@/lib/types";
import { useSatelliteProduct, useShowSatellite } from "@/stateStores/map/rasterData";
import { useMapRef } from "@/stateStores/map/mapView";

interface Props {
  belowLayer?: string;
  domain: "west" | "east";
}

export const SatelliteLayer = ({ belowLayer = "layer-radar-national-18", domain }: Props) => {
  const enabled = useShowSatellite();
  const satelliteProduct = useSatelliteProduct();
  const mapRef = useMapRef();

  const satelliteDomain = domain === "west" ? "GOES-West" : "GOES-East";

  const belowLayerId = mapRef?.getLayer(belowLayer) ? belowLayer : "wateroutline";

  const { data: satelliteData } = useAPI<RasterLayerData[]>(
    "/geomet",
    {
      layers: `${satelliteDomain}_${satelliteProduct}`,
    },
    {
      queryName: `${domain}SatelliteData`,
      enabled,
      interval: 1,
    },
  );

  if (!enabled || satelliteData?.status !== "success") return;

  return <RasterDataLayer apiData={satelliteData.data[0]} belowLayer={belowLayerId} />;
};
