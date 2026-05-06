import type { Feature, FeatureCollection, Point } from "geojson";
import { PAYLOAD_TYPE } from "../../config/tiles/index.js";

import type { CATEGORIES, OBS_TYPES } from "../../config/tiles/stationPlots.js";
import type { SEVERITIES, WAKE_TURBULENCE_CATEGORIES } from "../../config/tiles/pireps.js";

export type Prettify<T> = { [K in keyof T]: T[K] } & {};
export type Nullable<T> = { [K in keyof T]: T[K] | null };

export type ObsTypes = (typeof OBS_TYPES)[number];
export type Categories = (typeof CATEGORIES)[number];
export type WakeTurbClass = (typeof WAKE_TURBULENCE_CATEGORIES)[number];
export type StationTypes = "auto" | "manned";

export type PayloadType = (typeof PAYLOAD_TYPE)[number];
export type PayloadCache = { lastUpdatedTime: number; data: FeatureCollection };

export type PirepSeverity = (typeof SEVERITIES)[number];

export type StationList = {
  lastUpdatedId: number;
  data: {
    min: string[];
    med: string[];
    max: string[];
  };
};

export type ParsedMetarContents = {
  wind: Nullable<{
    raw: string;
    dir: number;
    speed: number;
    gust: number;
  }> | null;
  vis: number | null;
  wx: string | null;
  wind_shear: any;
  clouds:
    | Nullable<{
        raw: string;
        opacity: string;
        height: number;
        convective: any;
      }>[]
    | null;
  tt?: number | null;
  td?: number | null;
  altimeter: number | null;
  mslp: number | null;
  rawText: string | null;
};

export type WxMapPopupMetar = Prettify<
  Omit<ParsedMetarContents, "wind_shear"> & {
    validTime: number;
    windShear: any;
    rmk: string | null;
    stationType: string | null;
    obType: string | null;
    rvr: string | null;
    correctionLevel: string | null;
  }
>;

export type Wind = {
  raw: string | null;
  dir: number | null;
  speed: number | null;
  gust: number | null;
};

export type Cloud = {
  raw: string;
  opacity: string;
  height: number | null;
  convective: any;
};

export type OutputPopupData = Record<
  string,
  {
    lng: number;
    lat: number;
    siteName?: string | null;
    taf?: string | null;
    metars: Partial<ParsedMetarContents>[];
  }
>;
export type SurfacePlotData = Feature<Point, { siteId: string; uniqueSiteId: string; plotData: PlotData[] }>;

export type TiledSurfacePlotData = Feature<
  Point,
  Prettify<
    {
      siteId: string;
      startTime?: number;
      expiryTime?: number;
    } & PlotData
  >
>;

export type PlotData = {
  validTime: number;
  timeString: string;
  tt: number | null;
  td: number | null;
  ts?: number | null | undefined;
  mslp?: number | null;
  windDir: number | null;
  binnedWindDir: number | null;
  windSpd: number | null;
  binnedWindSpd: number | null;
  windGst: number | null;
  waveHeight?: number | null | undefined;
  wavePeriod?: number | null | undefined;
  moveDir?: number | null | undefined;
  moveSpd?: number | null | undefined;
  wx: string | null;
  vis: string | null;
  cat: Categories | null;
};

export type Popup = Feature<
  Point,
  {
    siteId: string;
    siteName?: string | null;
    taf: string | null;
    stationType: "lighthouse" | "ship" | "buoy" | "hwos" | "awos" | "auto";
    metars: Partial<WxMapPopupMetar>[];
    dataType: "site";
  }
>;
