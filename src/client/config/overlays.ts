import { LineLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";

export const TAF_OVERLAY: SymbolLayerSpecification = {
  id: "taf-sites",
  type: "symbol",
  source: "taf",
  layout: {
    "text-field": [
      "step",
      ["zoom"],
      "", // default: zoom < 2
      4.5,
      ["get", "siteId"], // zoom >= 2
    ],
    "icon-image": [
      "step",
      ["zoom"], // default: zoom < 6
      "icons:aircraft",
      4.5,
      "icons:aircraft",
    ],
    "icon-size": [
      "step",
      ["zoom"],
      0.35, // default: zoom < 10
      4.5,
      0.65,
    ],
    "text-size": [
      "step",
      ["zoom"],
      8, // default: zoom < 6
      8,
      14,
    ],
    "text-offset": [0.5, 0.5],
    "icon-allow-overlap": true,
    "text-allow-overlap": true,
    "text-variable-anchor": ["top-left", "bottom-right", "top-right", "bottom-left", "left", "right", "top", "bottom"],
  },
  paint: {
    "text-halo-width": 2,
    "text-halo-blur": 1,
    "text-halo-color": "rgb(255, 255, 255)",
  },
};

export const BEDPOSTS_OVERLAY: SymbolLayerSpecification = {
  id: "bedposts",
  type: "symbol",
  source: "bedposts",
  layout: {
    "text-field": ["step", ["zoom"], "", 5, ["get", "name"]],
    "text-size": ["step", ["zoom"], 10, 7, 14],
    "icon-image": ["step", ["zoom"], "", 5, "star-11"],
    "icon-size": ["step", ["zoom"], 0.8, 7, 1.25],
    "text-offset": [-1, 0],
    "text-anchor": "right",
    "text-font": ["Open Sans Regular Italic", "Arial Unicode MS Regular"],
    "text-allow-overlap": true,
    "icon-allow-overlap": true,
  },
  paint: {
    "text-color": "#ff9999",
    "text-halo-width": 0,
    "text-halo-blur": 1,
    "icon-halo-color": "rgba(146, 21, 21, 1)",
    "text-halo-color": "#000",
  },
};

export const LGF_OVERLAY: LineLayerSpecification = {
  id: "lgf-boundaries",
  type: "line",
  source: "lgf",
  paint: {
    "line-color": [
      "match",
      ["get", "domain"],
      "south",
      "rgb(255,0,255)",
      "central",
      "rgb(0,0,255)",
      "north",
      "rgb(255,0,0)",
      "rgb(0,255,0)",
    ],
    "line-width": 2,
  },
};

export const FIR_OVERLAY: LineLayerSpecification = {
  id: "fir-boundaries",
  type: "line",
  source: "fir",
  paint: { "line-color": "rgb(255,0,0)", "line-width": 1 },
};

export const GFA_OVERLAY: LineLayerSpecification = {
  id: "gfa-boundaries",
  type: "line",
  source: "gfa",
  paint: { "line-color": "rgb(0,0,255)", "line-width": 3 },
};

export const PUBLIC_OVERLAY: LineLayerSpecification = {
  id: "public-regions",
  type: "line",
  source: "publicRegions",
  paint: { "line-color": "rgb(0,0,0)", "line-width": 1 },
};

export const MARINE_OVERLAY: LineLayerSpecification = {
  id: "marine-regions",
  type: "line",
  source: "marineRegions",
  paint: { "line-color": "rgb(0,0,144)", "line-width": 1 },
};
