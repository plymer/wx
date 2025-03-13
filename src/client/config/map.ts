import { LngLatBoundsLike } from "maplibre-gl";

// define which satellites we have access to
export const SATELLITES = ["GOES-East", "GOES-West"] as const;
export type SatelliteList = (typeof SATELLITES)[number];

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

// helper types for satellite
export type SatelliteChannelsList = keyof typeof SATELLITE_CHANNELS;
export type SatelliteChannelsWMSName = (typeof SATELLITE_CHANNELS)[keyof typeof SATELLITE_CHANNELS]["wms"];
export type SatelliteChannelsMenuName = (typeof SATELLITE_CHANNELS)[keyof typeof SATELLITE_CHANNELS]["menuName"];

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
// helper types for radar
export type RadarProducts = typeof RADAR_PRODUCTS;
export type RadarProductsWMSName = RadarProducts[keyof RadarProducts]["wms"];
export type RadarProductsMenuName = RadarProducts[keyof RadarProducts]["menuName"];

// map object constants
const MAX_WEST: number = -180;
const MAX_SOUTH: number = 0;
const MAX_EAST: number = -20;
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
  "https://geo.weather.gc.ca/geomet?service=WMS&version=1.3.0&request=GetMap&format=image/png&bbox={bbox-epsg-3857}&crs=EPSG:3857&width=256&height=256&LAYERS_REFRESH_RATE=PT1M&layers=";
export const GEOMET_GETCAPABILITIES: string =
  "https://geo.weather.gc.ca/geomet/?lang=en&service=WMS&request=GetCapabilities&version=1.3.0&LAYERS_REFRESH_RATE=PT1M&layers=";

export const MAP_PROJECTIONS = ["mercator", "globe"] as const;
export type MapProjections = (typeof MAP_PROJECTIONS)[number];

export const MAP_LINES = ["gfa", "lgf", "fir", "tafs", "bedposts", "publicRegions", "marineRegions"] as const;
export type MapLines = (typeof MAP_LINES)[number];

export const MAP_OPTIONS_TABS = ["projection", "overlays"] as const;
export type MapOptionsTabs = (typeof MAP_OPTIONS_TABS)[number];

export const LAYER_TABS = ["satellite", "radar", "other"] as const;
export type LayerTabs = (typeof LAYER_TABS)[number];

export const ZOOM_THRESHOLDS = { mini: 2.25, reduced: 4.5, maximum: 6 } as const;
export type ZoomThresholds = keyof typeof ZOOM_THRESHOLDS;
