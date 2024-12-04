import { useGeoMetContext } from "@/contexts/geometContext";

const useMapConfig = () => {
  const geoMet = useGeoMetContext();
  // console.log(geoMet.radarProduct, geoMet.satelliteProduct);
  return;
};

export default useMapConfig;
