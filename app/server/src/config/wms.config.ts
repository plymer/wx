import { HOUR } from "../lib/constants.js";

export const GEOMET_GETCAPABILITIES =
  "https://geo.weather.gc.ca/geomet/?lang=en&service=WMS&request=GetCapabilities&version=1.3.0";

export const EUMETSAT_GETCAPABILITIES =
  "https://view.eumetsat.int/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities";

export const DATA_CUTOFF = 4 * HOUR; // hours

export const RADAR_PRODUCTS = ["RADAR_1KM_RRAI", "RADAR_1KM_RSNO"] as const;

export const GOES_PRODUCTS = [
  "1km_DayCloudType-NightMicrophysics",
  "1km_VisibleIRSandwich-NightMicrophysicsIR",
  "1km_DayVis-NightIR",
  "1km_FireTemperature-SWIR",
  "1km_SnowFog-NightMicrophysics",
  "2km_Ash",
  "2km_NightIR",
] as const;
