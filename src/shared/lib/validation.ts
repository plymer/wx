import { z } from "zod";

export const aqSchema = z.object({
  sensor_index: z.string(),
  monitor: z.string(),
  network: z.string(),
  lat: z.string(),
  lng: z.string(),
  date: z.string(),
  prov_terr: z.string(),
  pm25_recent_r: z.string(),
  pm25_recent: z.string(),
  pm25_1hr_r: z.string(),
  pm25_1hr: z.string(),
  pm25_3hr_r: z.string(),
  pm25_3hr: z.string(),
  pm25_24hr_r: z.string(),
  pm25_24hr: z.string(),
  temperature: z.string(),
  rh: z.string(),
  pressure: z.string(),
  val_24hr_r: z.string(),
  val_1hr_r: z.string(),
  val_r: z.string(),
  val_24hr: z.string(),
  val_1hr: z.string(),
  val: z.string(),
  icon_url_24hr_r: z.string(),
  icon_url_1hr_r: z.string(),
  icon_url_r: z.string(),
  icon_url_24hr: z.string(),
  icon_url_1hr: z.string(),
  icon_url: z.string(),
});

const stringOrNumber = () =>
  z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const parsed = Number(val);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }, z.number().optional());

export const metarSchema = z.object({
  rawText: z.string(),
  stationId: z.string().length(4),
  observationTime: z.date(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  tempC: z
    .number()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  dewpointC: z
    .number()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  windDirDegrees: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  windSpeedKt: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  windGustKt: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  wxString: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  visibilityStatuteMi: z.coerce
    .string()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  altimInHg: z
    .number()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  skyCondition: z
    .array(
      z.object({
        skyCover: z.string(),
        cloudBaseFtAgl: z.string().transform((val) => parseInt(val)),
      }),
    )
    .optional(),
  flightCategory: z
    .enum(["VFR", "IFR", "MVFR", "LIFR", ""])
    .optional()
    .transform((val) => (val === "" || val === undefined ? null : val)),
  metarType: z.enum(["METAR", "SPECI"]),
  elevationM: z.number(),
});

export const stationSchema = z.object({
  icaoId: z.string(),
  iataId: z.string(),
  faaId: z.string(),
  wmoId: z.string(),
  lat: z.number(),
  lon: z.number(),
  elev: z.number(),
  site: z.string(),
  state: z.string(),
  country: z.string(),
  priority: z.number(),
});
