// this hook will return the attributions for the data sources used in the map any time the map is rendered
import { useEffect, useState } from "react";
import { useMap } from "react-map-gl/maplibre";

const useDataAttributions = () => {
  const map = useMap()?.current;
  const [attributions, setAttributions] = useState<string[]>([]);

  const DEFAULT_ATTRIBUTIONS = [
    `<a href='https://www.openfreemap.org'>OpenFreeMap</a>`,
    `<a href='https://www.openmaptiles.org'>OpenMapTiles</a>`,
    `<a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>`,
  ];

  useEffect(() => {
    if (!map) return;

    const updateAttributions = () => {
      const style = map.getStyle();
      const unique = new Set<string>();
      Object.values(style.sources).forEach((source: any) => {
        if (source && typeof source.attribution === "string") {
          unique.add(source.attribution);
        }
      });
      setAttributions([...unique]);
    };

    // initial run
    updateAttributions();

    // listen for style/source changes
    map.on("styledata", updateAttributions);
    map.on("sourcedata", updateAttributions);

    return () => {
      map.off("styledata", updateAttributions);
      map.off("sourcedata", updateAttributions);
    };
  }, [map]);

  return [...DEFAULT_ATTRIBUTIONS, ...attributions];
};

export default useDataAttributions;
