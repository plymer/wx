import { InferSelectModel } from "drizzle-orm";
import { FeatureCollection, Point } from "geojson";
import { metars, pireps, stations, tafs } from "../db/tables/avwx.drizzle";
import { z } from "zod";
import { aqSchema, metarSchema, pirepSchema, stationSchema, tafSchema } from "./validation";
import { aqData } from "../db/tables/aq.drizzle";

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

// database schema-derived types
export type AQData = InferSelectModel<typeof aqData>;
export type StationData = InferSelectModel<typeof stations>;
export type MetarData = InferSelectModel<typeof metars>;
export type TafData = InferSelectModel<typeof tafs>;
export type PirepData = InferSelectModel<typeof pireps>;

// used in intermediate steps of the api data return for /wxmap/metars
export type StationPlotData = {
  siteId: string;
  metars: Omit<MetarData, "siteId" | "rawText">[];
};

export type MetarWithStation = Omit<MetarData, "rawText"> & {
  stations: {
    lat: number;
    lon: number;
  } | null;
};

// used for the rendering and filtering of station plots on the map
export type StationPlotGeoJSON = FeatureCollection<Point, Omit<MetarData, "rawText">>;

export type SfcObsPopupBundle = Record<
  string,
  {
    metaData: { siteName: string | null; siteCountry: string | null; siteState: string | null };
    metars: string[];
    tafs: string[];
  }
>;
