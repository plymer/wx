import { OverlayOptions } from "../lib/types";

export const TAF_OVERLAY: OverlayOptions = {
  layout: {
    "text-field": {
      stops: [
        [0, ""],
        [2, "{siteId}"],
        [10, "{siteId}"],
      ],
    },
    "icon-image": {
      stops: [
        [0, '"'],
        [6, "circle-11"],
      ],
    },
    "icon-size": {
      stops: [
        [6, 0.5],
        [10, 1],
      ],
    },
    "text-size": {
      stops: [
        [0, 6],
        [6, 12],
      ],
    },
    "text-anchor": {
      stops: [
        [0, "center"],
        [6, "top-left"],
      ],
    },
    "text-offset": {
      stops: [
        [0, [0, 0]],
        [10, [0, 0.5]],
      ],
    },
    "icon-allow-overlap": true,
    "text-allow-overlap": false,
    "text-justify": "auto",
  },
  paint: {
    "text-halo-width": 2,
    "text-halo-blur": 1,
    "text-halo-color": "rgb(255, 255, 255)",
  },
};

export const BEDPOST_OVERLAY: OverlayOptions = {
  layout: {
    "text-field": {
      stops: [
        [0, " "],
        [5, "{name}"],
        [10, "{name}"],
      ],
    },
    "text-size": {
      stops: [
        [5, 8],
        [10, 14],
      ],
    },
    "icon-image": {
      stops: [
        [0, " "],
        [5, "circle-11"],
        [10, "circle-11"],
      ],
    },
    "icon-size": 0.25,
    "text-offset": [0, 1],
    "text-font": ["Open Sans Regular Italic", "Arial Unicode MS Regular"],
    "text-allow-overlap": true,
  },
  paint: {
    "text-color": "rgba(146, 21, 21, 1)",
    "text-halo-width": 1,
    "text-halo-blur": 1,
    "icon-color": "#921515",
    "icon-halo-color": "rgba(146, 21, 21, 1)",
    "text-halo-color": "rgba(255, 255, 255, 1)",
  },
};

export const LGF_OVERLAY: OverlayOptions = {
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

export const FIR_OVERLAY: OverlayOptions = { paint: { "line-color": "rgb(255,0,0)", "line-width": 1 } };

export const GFA_OVERLAY: OverlayOptions = { paint: { "line-color": "rgb(0,0,255)", "line-width": 3 } };

export const PUBLIC_OVERLAY: OverlayOptions = { paint: { "line-color": "rgb(0,0,0)", "line-width": 1 } };

export const MARINE_OVERLAY: OverlayOptions = { paint: { "line-color": "rgb(0,0,144)", "line-width": 1 } };
