import React, { ReactElement } from "react";
import { useMap } from "react-map-gl/maplibre";

const DataAttributions = ({ ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  // get the map instance so we can work on it
  const map = useMap()?.current;
  if (!map) return;

  // grab the map style so we can extract the sources and attributions
  const style = map.getStyle();

  Object.entries(style.sources).forEach((s) => {
    console.log((s as any).attribution);
  });

  const sources = style.sources;

  console.log("Map Sources:", sources);

  return <div {...props}>DataAttributions</div>;
};

export default DataAttributions;
