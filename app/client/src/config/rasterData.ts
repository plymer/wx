import type { LngLatBoundsLike } from "maplibre-gl";

export const RASTER_DATA_TYPES = ["satellite", "radar"] as const;

export const GEOMET_GETMAP =
  "https://geo.weather.gc.ca/geomet?service=WMS&version=1.3.0&request=GetMap&format=image/webp&bbox={bbox-epsg-3857}&crs=EPSG:3857&width=256&height=256&LAYERS_REFRESH_RATE=PT1M&TRANSPARENT=true&TILED=true&layers=";

export const EUMETSAT_GETMAP =
  "https://view.eumetsat.int/geoserver/wms?service=WMS&version=1.3.0&request=GetMap&format=image/png&bbox={bbox-epsg-3857}&crs=EPSG:3857&width=256&height=256&layers=";

export const GEOMET_ATTRIBUTION = "<a href='https://weather.gc.ca/'>ECCC MSC</a>";

export const EUMETSAT_ATTRIBUTION = "<a href='https://view.eumetsat.int/'>EUMETSAT</a>";

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
const GOES_METEOSAT_SPLIT: number = -30;
export const MAP_BOUNDS: LngLatBoundsLike & [number, number, number, number] = [
  MAX_WEST,
  MAX_SOUTH,
  MAX_EAST,
  MAX_NORTH,
];
export const GOES_EAST_BOUNDS: [number, number, number, number] = [
  EAST_WEST_SPLIT,
  MAX_SOUTH,
  GOES_METEOSAT_SPLIT,
  MAX_NORTH,
];
export const GOES_WEST_BOUNDS: [number, number, number, number] = [MAX_WEST, MAX_SOUTH, EAST_WEST_SPLIT, MAX_NORTH];
export const RADAR_BOUNDS: [number, number, number, number] = [MAX_WEST, MAX_SOUTH, MAX_EAST, 60];
export const EUMETSAT_BOUNDS: [number, number, number, number] = [GOES_METEOSAT_SPLIT, MAX_SOUTH, MAX_EAST, MAX_NORTH];
