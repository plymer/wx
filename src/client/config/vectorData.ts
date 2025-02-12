// contains configuration for how to display/draw the vector data on the map

/*
-- need to incorporate turf library to draw properly-sized circles of spatial dimensions

[data-driven styling](https://maplibre.org/maplibre-gl-js/docs/examples/data-driven-lines/)
[expressions for data-driven styling](https://maplibre.org/maplibre-style-spec/expressions/#match)

*/

import { GeoJSON } from "../lib/types";

export const VECTOR_DATA_TYPES = ["lightning", "surfaceObs", "pireps", "airmets", "sigmets"] as const;
export type VectorDataTypes = (typeof VECTOR_DATA_TYPES)[number];

export type VectorConfig = {
  paint: Object;
  type: "circle";
};

export const LIGHTNING_DISPLAY: VectorConfig = {
  paint: {
    "circle-radius": 10, // this will need some turf-ing for proper sizing based on lat/lon/zoom
    "circle-color": "rgba(255,0,0, 0)",
    "circle-stroke-color": "rgb(255,0,0)",
    "circle-stroke-width": 2,
  },
  type: "circle",
};

export type VectorDisplayConfig = {
  [K in VectorDataTypes]?: VectorConfig;
};

export type VectorDataList = {
  [K in VectorDataTypes]?: GeoJSON;
};

export const VECTOR_DISPLAY_CONFIGS: VectorDisplayConfig = { lightning: LIGHTNING_DISPLAY };
