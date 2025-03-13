// contains configuration for how to display/draw the vector data on the map

/*
-- need to incorporate turf library to draw properly-sized circles of spatial dimensions

[data-driven styling](https://maplibre.org/maplibre-gl-js/docs/examples/data-driven-lines/)
[expressions for data-driven styling](https://maplibre.org/maplibre-style-spec/expressions/#match)

*/

export const VECTOR_DATA_TYPES = ["lightning", "surfaceObs", "pirep", "airmet", "sigmet"] as const;
export type VectorDataTypes = (typeof VECTOR_DATA_TYPES)[number];

export type VectorConfig = {
  paint: Object;
  type: "circle" | "fill";
};

// TODO :: this will be deprecated since we are moving to a 'threat polygon' method of showing lightning
export const LIGHTNING_DISPLAY: VectorConfig = {
  paint: {
    "circle-radius": 10, // this will need some turf-ing for proper sizing based on lat/lon/zoom
    "circle-color": "rgba(255,0,0, 0)",
    "circle-stroke-color": "rgb(255,0,0)",
    "circle-stroke-width": 2,
  },
  type: "circle",
};

export const SIGMET_DISPLAY: VectorConfig = {
  paint: {
    "fill-color": "rgb(255,0,0)",
    "fill-outline-color": "rgb(255,255,255)",
    "fill-opacity": 0.5,
  },
  type: "fill",
};

export const AIRMET_DISPLAY: VectorConfig = {
  paint: {
    "fill-color": "rgb(255,255,0)",
    "fill-outline-color": "rgb(255,255,255)",
    "fill-opacity": 0.5,
  },
  type: "fill",
};

export const PIREP_DISPLAY: VectorConfig = {
  paint: {
    "fill-color": "rgb(0,255,255)",
    "fill-outline-color": "rgb(255,255,255)",
    "fill-opacity": 0.5,
  },
  type: "fill",
};

export type VectorDisplayConfig = {
  [K in VectorDataTypes]?: VectorConfig;
};

export const VECTOR_DISPLAY_CONFIGS: VectorDisplayConfig = {
  lightning: LIGHTNING_DISPLAY,
  sigmet: SIGMET_DISPLAY,
  airmet: AIRMET_DISPLAY,
  pirep: PIREP_DISPLAY,
};
