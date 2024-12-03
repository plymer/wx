import { useGeoMetContext } from "@/contexts/geometContext";
import GeoMetLayer from "./GeoMetLayer";
import RasterDataLayer from "./RasterDataLayer";
import useMapConfig from "@/hooks/useMapConfig";

interface Props {
  config: Object;
}

const LayerManager = ({ config }: Props) => {
  const geoMet = useGeoMetContext();

  const mapConfig = useMapConfig();

  // config.wms.map((d) => console.log(d));

  return (
    <>
      <div className="text-white">LayerManager:</div>
      <RasterDataLayer />
      {config.wms.map((d, i) => (
        <GeoMetLayer key={i} type="satellite" product={geoMet.satelliteProduct} domain={d} belowLayer="wateroutline" />
      ))}
    </>
  );
};

export default LayerManager;
