import type { LineLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";

export const TAF_OVERLAY: SymbolLayerSpecification = {
  id: "tafSites",
  type: "symbol",
  source: "taf",
  layout: {
    "text-field": ["step", ["zoom"], "", 4.5, ["get", "siteId"]],
    "icon-image": ["step", ["zoom"], "", 4.5, "icons:aircraft"],
    "icon-size": ["step", ["zoom"], 0.45, 8, 0.9],
    "text-size": ["step", ["zoom"], 8, 8, 14],
    "text-font": ["Metropolis-Regular"],
    "text-radial-offset": ["step", ["zoom"], 1.5, 8, 1],
    "icon-allow-overlap": true,
    "text-allow-overlap": true,
    "text-variable-anchor": ["top-left", "bottom-right", "top-right", "bottom-left", "left", "right", "top", "bottom"],
  },
  paint: {
    "text-halo-width": 2,
    "text-halo-blur": 1,
    "text-halo-color": "#fff",
    "icon-color": "#000",
    "icon-halo-color": "#fff",
    "icon-halo-width": 1,
    "icon-halo-blur": 1,
  },
};

export const BEDPOSTS_OVERLAY: SymbolLayerSpecification = {
  id: "bedposts",
  type: "symbol",
  source: "bedposts",
  layout: {
    "text-field": ["step", ["zoom"], "", 5, ["get", "name"]],
    "text-size": ["step", ["zoom"], 8, 7, 10],
    "icon-image": ["step", ["zoom"], "", 5, "icons:bedpost"],
    "icon-size": ["step", ["zoom"], 0.75, 7, 1.75],
    "text-radial-offset": ["step", ["zoom"], 2, 7, 0],
    "text-anchor": ["step", ["zoom"], "left", 7, "center"],
    "text-font": ["Open-Sans-Italic"],
    "text-line-height": 1.2,
    "text-allow-overlap": true,
    "icon-allow-overlap": true,
  },
  paint: {
    "text-color": "#000",
    "text-halo-color": "#fff",
    "text-halo-width": 1,
    "text-halo-blur": 1,
    "icon-halo-color": "#000",
    "icon-halo-width": 2,
    "icon-color": "#fff",
  },
};

export const LGF_OVERLAY: LineLayerSpecification = {
  id: "lgfBoundaries",
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
  id: "firBoundaries",
  type: "line",
  source: "fir",
  paint: { "line-color": "rgb(255,0,0)", "line-width": 1 },
};

export const GFA_OVERLAY: LineLayerSpecification = {
  id: "gfaBoundaries",
  type: "line",
  source: "gfa",
  paint: { "line-color": "rgb(0,0,255)", "line-width": 3 },
};

export const PUBLIC_OVERLAY: LineLayerSpecification = {
  id: "publicRegions",
  type: "line",
  source: "publicRegions",
  paint: { "line-color": "rgb(0,0,0)", "line-width": 1 },
};

export const MARINE_OVERLAY: LineLayerSpecification = {
  id: "marineRegions",
  type: "line",
  source: "marineRegions",
  paint: { "line-color": "rgb(0,0,144)", "line-width": 1 },
};
