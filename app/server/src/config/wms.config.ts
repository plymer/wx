import { HOUR } from "../lib/constants.js";

export const GEOMET_GETCAPABILITIES: string =
  "https://geo.weather.gc.ca/geomet/?lang=en&service=WMS&request=GetCapabilities&version=1.3.0&LAYERS_REFRESH_RATE=PT1M";

export const EUMETSAT_GETCAPABILITIES =
  "https://view.eumetsat.int/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities";

export const DATA_CUTOFF = 4 * HOUR; // hours
