// contains configuration for how to display/draw the vector data on the map

import { CircleLayerSpecification, FillLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";

/*
-- need to incorporate turf library to draw properly-sized circles of spatial dimensions

[data-driven styling](https://maplibre.org/maplibre-gl-js/docs/examples/data-driven-lines/)
[expressions for data-driven styling](https://maplibre.org/maplibre-style-spec/expressions/#match)

*/

export const VECTOR_DATA_TYPES = ["lightning", "pirep", "airmet", "sigmet", "aq"] as const;

export const LIGHTNING_ALT: SymbolLayerSpecification = {
  type: "symbol",
  id: "lightning-alt",
  source: "lightning-data",
  layout: {
    "text-field": "X",
    "text-overlap": "always",
    "symbol-sort-key": ["get", "validTime"],
    "text-size": 14,
    "text-font": ["Monospace Regular"],
  },
  paint: { "text-color": "rgb(255,0,155)", "text-halo-color": "rgb(255,255,255)", "text-halo-width": 1 },
};

// TODO :: this will be deprecated since we are moving to a 'threat polygon' method of showing lightning
export const LIGHTNING_DISPLAY: CircleLayerSpecification = {
  paint: {
    "circle-radius": 10, // this will need some turf-ing for proper sizing based on lat/lon/zoom
    "circle-color": "rgba(255,0,0,0.5)",
  },
  layout: {
    "circle-sort-key": ["get", "validTime"],
  },
  type: "circle",
  id: "lightning-data",
  source: "lightning-data",
};

export const SIGMET_DISPLAY: FillLayerSpecification = {
  paint: {
    "fill-color": "rgb(255,0,0)",
    "fill-outline-color": "rgb(255,255,255)",
    "fill-opacity": 0.5,
  },
  type: "fill",
  id: "sigmet-data",
  source: "sigmet-data",
};

export const AIRMET_DISPLAY: FillLayerSpecification = {
  paint: {
    "fill-color": "rgb(255,255,0)",
    "fill-outline-color": "rgb(255,255,255)",
    "fill-opacity": 0.5,
  },
  type: "fill",
  id: "airmet-data",
  source: "airmet-data",
};

export const PIREP_DISPLAY: FillLayerSpecification = {
  paint: {
    "fill-color": "rgb(0,255,255)",
    "fill-outline-color": "rgb(255,255,255)",
    "fill-opacity": 0.5,
  },
  type: "fill",
  id: "pirep-data",
  source: "pirep-data",
};

export const AQ_DISPLAY: CircleLayerSpecification = {
  paint: {
    "circle-radius": 10, // this will need some turf-ing for proper sizing based on lat/lon/zoom
    "circle-color": [
      "step",
      ["get", "pm25"],
      "#00ff00", // pm25 <= 5: green
      25,
      "#ffff00", // 5 < pm25 <= 10: yellow
      50,
      "#ff9900", // 10 < pm25 <= 15: orange
      75,
      "#ff0000", // pm25 > 15: red
      100,
      "#990000", // pm25 > 20: dark red
    ],
  },
  layout: { visibility: "visible", "circle-sort-key": ["get", "validTime"] },
  type: "circle",
  id: "aq-data",
  source: "aq-data",
};

export const AQ_VALUE_DISPLAY: SymbolLayerSpecification = {
  type: "symbol",
  id: "aq-value-data",
  source: "aq-data",
  layout: {
    "text-field": ["get", "pm25"],
    "text-size": 12,
    "text-font": ["Monospace Regular"],
    "text-offset": [0, 0],
    "text-anchor": "center",
    "text-allow-overlap": false,
    "symbol-sort-key": ["get", "validTime"],
  },
  paint: {
    "text-color": "rgb(0,0,0)",
    "text-halo-color": "rgb(255,255,255)",
    "text-halo-width": 1,
  },
};

export const VECTOR_DISPLAY_CONFIGS = {
  lightning: LIGHTNING_DISPLAY,
  sigmet: SIGMET_DISPLAY,
  airmet: AIRMET_DISPLAY,
  pirep: PIREP_DISPLAY,
  aq: AQ_DISPLAY,
};

export const AQ_ATTRIBUTION = { en: "<a href='https://cyclone.unbc.ca/aqmap/'>UNBC Cyclone</a>" };
