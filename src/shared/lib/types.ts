import { InferSelectModel } from "drizzle-orm";
import { metars, stations, tafs } from "../db/tables/avwx.drizzle";
import { z } from "zod";
import { aqSchema, metarSchema, stationSchema, tafSchema } from "./validation";
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

// database schema-derived types
export type AQData = Omit<InferSelectModel<typeof aqData>, "id">;
export type StationData = InferSelectModel<typeof stations>;
export type MetarData = InferSelectModel<typeof metars>;
export type TafData = InferSelectModel<typeof tafs>;
