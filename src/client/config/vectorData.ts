// contains configuration for how to display/draw the vector data on the map

import {
  CircleLayerSpecification,
  FillLayerSpecification,
  FilterSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";

export const CLUSTERED: FilterSpecification = ["has", "point_count"];
export const UNCLUSTERED: FilterSpecification = ["!", ["has", "point_count"]];

export const VECTOR_DATA_TYPES = ["surfaceObs", "lightning", "pirep", "airmet", "sigmet", "aq"] as const;

export const XMET_TYPES = ["airmet", "sigmet"] as const;

export const LIGHTNING_DISPLAY: SymbolLayerSpecification = {
  type: "symbol",
  id: "lightning-data",
  source: "lightning-data",
  layout: {
    "text-field": "X",
    "text-overlap": "always",
    "symbol-sort-key": ["get", "validTime"],
    "text-size": 14,
    "text-font": ["Metropolis-Regular"],
  },
  paint: { "text-color": "rgb(255,0,155)", "text-halo-color": "rgb(255,255,255)", "text-halo-width": 1 },
};

const SIGMET_COLOUR = "rgb(184,6,6)";

export const SIGMET_DISPLAY: FillLayerSpecification = {
  paint: {
    "fill-color": SIGMET_COLOUR,
    "fill-opacity": ["case", ["==", ["get", "acknowledged"], true], 0.25, 0.5],
  },
  type: "fill",
  id: "layer-sigmet",
  source: "sigmet-data",
};

export const SIGMET_DISPLAY_OUTLINE: LineLayerSpecification = {
  id: "layer-sigmet-outline",
  type: "line",
  source: "sigmet-data",
  paint: {
    "line-color": SIGMET_COLOUR,
    "line-width": 2,
    "line-opacity": ["case", ["==", ["get", "acknowledged"], true], 0.75, 1],
  },
};

const AIRMET_COLOUR = "rgb(235,235,49)";

export const AIRMET_DISPLAY: FillLayerSpecification = {
  paint: {
    "fill-color": AIRMET_COLOUR,
    "fill-opacity": ["case", ["==", ["get", "acknowledged"], true], 0.25, 0.5],
  },
  type: "fill",
  id: "layer-airmet",
  source: "airmet-data",
};

export const AIRMET_DISPLAY_OUTLINE: LineLayerSpecification = {
  id: "layer-airmet-outline",
  type: "line",
  source: "airmet-data",
  paint: {
    "line-color": AIRMET_COLOUR,
    "line-width": 2,
    "line-opacity": ["case", ["==", ["get", "acknowledged"], true], 0.75, 1],
  },
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
    "circle-color": ["step", ["get", "pm25"], "#00ff00", 25, "#ffff00", 50, "#ff9900", 75, "#ff0000", 100, "#990000"],
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
    "text-font": ["Metropolis-Regular"],
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
