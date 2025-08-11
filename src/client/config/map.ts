import { LngLatBoundsLike } from "maplibre-gl";

// define which satellites we have access to
export const SATELLITES = ["GOES-East", "GOES-West"] as const;

// available satellite products
export const SATELLITE_CHANNELS = {
  dayNightMicro: {
    menuName: "Day/Night Microphysics",
    wms: "1km_DayCloudType-NightMicrophysics",
  },
  irSandwich: {
    menuName: "IR Sandwich",
    wms: "1km_VisibleIRSandwich-NightMicrophysicsIR",
  },
  dayNightVisIr: {
    menuName: "Day Vis/Night IR",
    wms: "1km_DayVis-NightIR",
  },
  fireTemp: {
    menuName: "SW IR Fire Temperature",
    wms: "1km_FireTemperature-SWIR",
  },
  snowFogNightMicro: {
    menuName: "Snow and Fog/Night Microphysics",
    wms: "1km_SnowFog-NightMicrophysics",
  },
  ash: { menuName: "Volcanic Ash", wms: "2km_Ash" },
  nightIr: { menuName: "Night IR", wms: "2km_NightIR" },
} as const;

// define our radar products
export const RADAR_PRODUCTS = {
  rain: {
    menuName: "1KM Rain CAPPI",
    wms: "RADAR_1KM_RRAI",
  },
  snow: {
    menuName: "1KM Snow CAPPI",
    wms: "RADAR_1KM_RSNO",
  },
} as const;

// map object constants
const MAX_WEST: number = -180;
const MAX_SOUTH: number = -85;
const MAX_EAST: number = 45;
const MAX_NORTH: number = 85;
const EAST_WEST_SPLIT: number = -90;
export const MAP_BOUNDS: LngLatBoundsLike & [number, number, number, number] = [
  MAX_WEST,
  MAX_SOUTH,
  MAX_EAST,
  MAX_NORTH,
];
export const GOES_EAST_BOUNDS: [number, number, number, number] = [EAST_WEST_SPLIT, MAX_SOUTH, MAX_EAST, MAX_NORTH];
export const GOES_WEST_BOUNDS: [number, number, number, number] = [MAX_WEST, MAX_SOUTH, EAST_WEST_SPLIT, MAX_NORTH];
export const RADAR_BOUNDS: [number, number, number, number] = [MAX_WEST, MAX_SOUTH, MAX_EAST, 60];

export const MAP_TILE_CACHE_SIZE: number = 1024 * 1024 * 400; // in bytes

// settings for data layers
export const NUM_HRS_DATA: number = 3;
export const GEOMET_GETMAP: string =
  "https://geo.weather.gc.ca/geomet?service=WMS&version=1.3.0&request=GetMap&format=image/png&bbox={bbox-epsg-3857}&crs=EPSG:3857&width=256&height=256&LAYERS_REFRESH_RATE=PT1M&TRANSPARENT=true&TILED=true&layers=";
export const GEOMET_GETCAPABILITIES: string =
  "https://geo.weather.gc.ca/geomet/?lang=en&service=WMS&request=GetCapabilities&version=1.3.0&LAYERS_REFRESH_RATE=PT1M&layers=";

export const MAP_PROJECTIONS = ["mercator", "globe"] as const;

export const MAP_LINES = ["gfa", "lgf", "fir", "tafs", "bedposts", "publicRegions", "marineRegions"] as const;

export const MAP_OPTIONS_TABS = ["projection", "overlays"] as const;

export const LAYER_TABS = ["satellite", "radar", "other"] as const;

export const ZOOM_THRESHOLDS = { mini: 2.25, reduced: 4.5, maximum: 6 } as const;
