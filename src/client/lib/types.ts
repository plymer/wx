// custom type definitions

import { MapLines } from "../config/map";
import { PUBLIC_FORECAST_CONFIG } from "../config/public";
import { VectorDataTypes } from "../config/vectorData";

export type AnimationState = "playing" | "loading" | "paused" | "stopped";

export type APIResponse<TData> = {
  status: "error" | "success";
  error?: any;
  data?: TData;
};

export type SiteData = {
  icaoId: string;
  location: string;
  lat: string;
  lon: string;
  elev_f: string;
  elev_m: string;
  sunrise: string;
  sunset: string;
};

export type TAFData = {
  taf: string;
};

export type ParsedTAF = {
  main: string | undefined;
  partPeriods: string[] | undefined;
  rmk: string | undefined;
};

export type METAR = {
  metars: string[];
};

export type GFAData = {
  domain: string;
  cldwx: string[];
  turbc: string[];
};

export type OtherChartData = {
  domain: string;
  images: string[];
};

export type HubData = {
  siteName: string;
  header: string;
  discussion: string;
  outlook: string;
  forecaster: string;
  office: string;
};

// this replaces 'LayerData' for the raster layers
export type RasterLayerData = {
  name: string;
  domain: "national" | "west" | "east";
  type: string;
  timeSteps: { validTime: number }[];
};

export type MapLayerConfig = {
  vector: string[] | "east" | "west" | "national";
  raster: string[];
};

// used to define the vector data (TODO: rename)
export type ToggleDataOption = {
  type: VectorDataTypes | MapLines;
  name: string;
  state: boolean;
  toggle: () => void;
};

export type GeoJSON = {
  features: GeoJSONFeature[];
  type: "FeatureCollection";
};

export type GeoJSONFeature = {
  geometry: {
    coordinates: number[] | number[][] | number[][][][];
    type: GeoJSONFeatureTypes;
  };
  properties: Record<string, any>;
  type: "Feature";
};

export type GeoJSONFeatureTypes =
  | "Point"
  | "LineString"
  | "Polygon"
  | "MultiPoint"
  | "MultiLineString"
  | "MultiPolygon";

export type OverlayOptions = {
  layout?: Object;
  paint?: Object;
};

export type PublicBulletin = string;

export type PublicForecastOffice = keyof typeof PUBLIC_FORECAST_CONFIG;
