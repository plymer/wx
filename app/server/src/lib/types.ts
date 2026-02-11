import type { InferSelectModel } from "drizzle-orm";
import type { FeatureCollection, MultiPolygon, Point } from "geojson";
import { metars, pireps, sigmets, stations, tafs } from "../db/tables/avwx.drizzle.js";
import { z } from "zod";
import { airSigmetsSchema, aqSchema, metarSchema, pirepSchema, stationSchema, tafSchema } from "./validation.js";
import { aqData } from "../db/tables/aq.drizzle.js";
import { XMET_TYPES } from "../config/alphanumeric.config.js";
import type { OFFICE_REGION_MAP } from "../config/charts.config.js";

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type GFAData = {
  domain: string;
  cldwx: string[];
  turbc: string[];
};

export type OtherChartData = {
  domain: string;
  images: string[];
};

export type OutlookData = {
  [Office in keyof typeof OFFICE_REGION_MAP]?: {
    [Region in keyof (typeof OFFICE_REGION_MAP)[Office]]?: {
      office: Office;
      id: Region;
      name: (typeof OFFICE_REGION_MAP)[Office][Region];
      panels: Panel[];
    }[];
  }[];
};

export type RegionData = {
  office: string;
  id: string;
  name: string;
  panels: Panel[];
};

export type Panel = {
  id: string;
  name: string;
  date: string;
  product: string;
  office: string;
  region: string;
  valid: string;
  url: string;
};

export type HubData = {
  siteName: string;
  header: string;
  discussion: string;
  outlook: string;
  forecaster: string;
  office: string;
};

export type XmetTypes = (typeof XMET_TYPES)[number];

export type XmetAPIData = {
  issuer: string;
  header: string;
  domain: string;
  alphaCode?: string;
  charCode: string;
  numberCode: number;
  sequenceId: string;
  startTime: number;
  endTime: number;
  hazard: string;
  motionVector: {
    direction: number | null;
    speed: number;
  };
  text: string;
  dataType: XmetTypes;
};

export type XmetGeoJSON = FeatureCollection<MultiPolygon, XmetAPIData>;

export type RadarDomains = "national";
export type SatelliteDomains = "east" | "west" | "europe";
export type WMSDomains = Prettify<RadarDomains | SatelliteDomains>;
export type WMSLayerTypes = "radar" | "satellite";
export type WMSLayer = {
  name: string;
  dimension: string;
  domain: WMSDomains;
  type: WMSLayerTypes;
  title?: string;
  timeSteps?: {
    validTime: number;
  }[];
};

export type XMLCacheFile<TData, TDataName extends string> = {
  response: {
    requestIndex: number;
    dataSource: { name: string };
    request: { type: string };
    errors: any;
    warnings: any;
    timeTakenMs: number;
    data: { [Key in TDataName extends string ? TDataName : string]: TData[] };
  };
};

// data from aq csv files
export type CSVAQData = z.infer<typeof aqSchema>;

// data from the avwx cache files
export type CacheStationData = z.infer<typeof stationSchema>;
export type CacheMetarData = z.infer<typeof metarSchema>;
export type CacheTafData = z.infer<typeof tafSchema>;
export type CachePirepData = z.infer<typeof pirepSchema>;
export type CacheAirSigmetsData = z.infer<typeof airSigmetsSchema>;

// database schema-derived types
export type AQData = InferSelectModel<typeof aqData>;
export type StationData = InferSelectModel<typeof stations>;
export type MetarData = InferSelectModel<typeof metars>;
export type TafData = InferSelectModel<typeof tafs>;
export type PirepData = InferSelectModel<typeof pireps>;
export type SigmetData = InferSelectModel<typeof sigmets>;

export type WmoDirection =
  | "N"
  | "NNE"
  | "NE"
  | "ENE"
  | "E"
  | "ESE"
  | "SE"
  | "SSE"
  | "S"
  | "SSW"
  | "SW"
  | "WSW"
  | "W"
  | "WNW"
  | "NW"
  | "NNW"
  | "-";

export type RawIntlSigmetData = {
  isigmetId: number;
  icaoId: string;
  firId: string;
  firName: string;
  receiptTime: string;
  validTimeFrom: number;
  validTimeTo: number;
  seriesId: string;
  hazard: string;
  qualifier: string;
  base: number | null;
  top: number | null;
  geom: "AREA" | "AREAS";
  coords: Coords[] | Coords[][];
  dir: WmoDirection | null;
  spd: "STNR" | number | null;
  chng: "NC" | "WKN" | "INTSF";
  rawSigmet: string;
};

// used in intermediate steps of the api data return for /wxmap/metars
export type MetarElements = Prettify<Omit<MetarData, "siteId" | "rawText">>;
export type StationPlotData = {
  siteId: string;
  metars: MetarElements[];
};

export type MetarWithStation = Prettify<
  Omit<MetarData, "rawText"> & {
    stations: {
      lat: number;
      lon: number;
    } | null;
  }
>;

export type StationPlotPopupData = {
  siteId: string;
  siteName: string | null;
  siteCountry: string | null;
  siteState: string | null;
  metars: string[];
  taf: string | null;
  dataType: "site";
};

// used for the rendering and filtering of station plots on the map
export type StationPlotGeoJSON = FeatureCollection<
  Point,
  Prettify<Omit<MetarData, "rawText"> & { validTimeString: string }>
>;

export type Coords = { lat: number; lon: number };

export type AlertType = "warning" | "watch" | "advisory" | "statement";
export type AlertColour = "grey" | "yellow" | "orange" | "red";

export type WxOAlert = {
  alertCode: string;
  status: "ended" | "active";
  type: AlertType;
  colour: AlertColour;
  issueTime: Date;
  timezone: string;
  issueTimeText: string;
  expiryTime: Date;
  eventOnsetTime: Date;
  eventEndTime: Date;
  alertBannerText: string;
  alertNameShort: string;
  text: string;
  impact: string;
  confidence: string;
};

export type WxOPolygonAlert = Record<string, WxOAlert>;

export type WxOAPIResponse = {
  displayName: string;
  lastUpdated: number;
  alert: {
    zoneId: string;
    uuid: string;
    mostSevere: string;
    alerts: WxOAlert[];
    lastUpdated: number;
    hwyMostSevere: string;
  };
  observation: {
    observedAt: string;
    provinceCode: string;
    tcid: string;
    timeStamp: string;
    iconCode: string;
    condition: string;
    temperature: {
      metric: string;
      metricUnrounded: string;
    };
    dewpoint: {
      metric: string;
      metricUnrounded: string;
    };
    feelsLike: {
      metric: string;
    };
    pressure: {
      metric: string;
    };
    tendency: string;
    visibility: {
      metric: string;
    };
    humidity: string;
    windSpeed: {
      metric: string;
    };
    windGust: {
      metric: string;
    };
    windDirection: string;
  };
  dailyFcst: {
    regionalNormals: {
      metric: {
        highTemp: number;
        lowTemp: number;
      };
    };
    daily: Array<{
      date: string;
      periodID: number;
      periodLabel: string;
      iconCode: string;
      text: string;
    }>;
    dailyIssuedTimeEpoch: string;
  };
  aqhi: {
    riskText: string;
    aqhiVal: number;
    epochTime: number;
  };
  riseSet: {
    set: {
      time12h: string;
      epochTimeRounded: string;
      time: string;
    };
    timeZone: string;
    rise: {
      time12h: string;
      epochTimeRounded: string;
      time: string;
    };
  };
  riseSetNextDay: {
    set: {
      time12h: string;
      epochTimeRounded: string;
      time: string;
    };
    timeZone: string;
    rise: {
      time12h: string;
      epochTimeRounded: string;
      time: string;
    };
  };
  riseData: Array<{
    set: {
      time12h: string;
      epochTimeRounded: string;
      time: string;
    };
    timeZone: string;
    rise: {
      time12h: string;
      epochTimeRounded: string;
      time: string;
    };
  }>;
  metNotes: Array<unknown>;
  aqhiFcst: {
    epochTime: number;
    daily: Array<{
      aqhiVal: number;
      periodID: number;
    }>;
  };
  zonePoly: string;
  province: string;
  tcId: string;
  climateId: string;
  tc2Id: string;
};

export type WxOPolygonProperties = {
  index: string;
  name: string;
  prov: string;
  alerts: {
    zoneName: string;
    prov: string;
    status: string;
    locId: string;
    feaId: string;
    program: string;
    wxoCode: string;
    zones: string[];
    alertRef: string;
  }[];
};

export type WarningProperties = Pick<
  WxOAlert,
  "alertCode" | "type" | "issueTime" | "alertNameShort" | "colour" | "impact" | "confidence"
>;
