import { report } from "process";
import { z } from "zod";

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

export const aqSchema = z.object({
  sensor_index: z.string(),
  monitor: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? null : val.slice(0, 45))),
  network: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  lat: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  lng: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  date: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val.replace(" ", "T") + "Z") : null)),
  prov_terr: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  pm25_recent_r: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  pm25_recent: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  pm25_1hr_r: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  pm25_1hr: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  pm25_3hr_r: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  pm25_3hr: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  pm25_24hr_r: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  pm25_24hr: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  temperature: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  rh: z.string().optional(),
  pressure: z.string().optional(),
  val_24hr_r: z.string().optional(),
  val_1hr_r: z.string().optional(),
  val_r: z.string().optional(),
  val_24hr: z.string().optional(),
  val_1hr: z.string().optional(),
  val: z.string().optional(),
  icon_url_24hr_r: z.string().optional(),
  icon_url_1hr_r: z.string().optional(),
  icon_url_r: z.string().optional(),
  icon_url_24hr: z.string().optional(),
  icon_url_1hr: z.string().optional(),
  icon_url: z.string().optional(),
});

export const metarSchema = z.object({
  rawText: z.string(),
  stationId: z.string().length(4),
  observationTime: z.coerce.date(),
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

const tafForecastSchema = z.object({
  fcstTimeFrom: z.coerce.date(),
  fcstTimeTo: z.coerce.date(),
  changeIndicator: z
    .enum(["FM", "BECMG", "TEMPO", "PROB"])
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  probability: z
    .number()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  windDirDegrees: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  windSpeedKt: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  windGustKt: stringOrNumber().transform((val) => (val === undefined ? null : val)),
  visibilityStatuteMi: z.coerce
    .string()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  wxString: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  skyCondition: z
    .array(
      z.object({
        skyCover: z.string(),
        cloudBaseFtAgl: z.string().transform((val) => parseInt(val)),
      }),
    )
    .optional()
    .transform((val) => (val === undefined ? null : val)),
});

export const tafSchema = z.object({
  rawText: z.string(),
  stationId: z.string().length(4),
  issueTime: z.coerce.date(),
  bulletinTime: z.coerce.date(),
  validTimeFrom: z.coerce.date(),
  validTimeTo: z.coerce.date(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  elevationM: z
    .number()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  forecast: z
    .union([tafForecastSchema, z.array(tafForecastSchema)])
    .transform((val) => (Array.isArray(val) ? val : [val])),
});

export const pirepSchema = z.object({
  rawText: z.string(),
  reportType: z.enum(["PIREP", "AIREP"]),
  receiptTime: z.coerce.date(),
  observationTime: z.coerce.date(),
  qualityControlFlags: z
    .object({
      badLocation: z.coerce
        .boolean()
        .optional()
        .transform((val) => (val === undefined ? null : val)),
    })
    .transform((val) => (val === undefined ? null : val))
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  aircraftRef: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  tempC: z
    .number()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  altitudeFtMsl: z
    .number()
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  skyCondition: z
    .array(
      z.object({
        skyCover: z
          .string()
          .optional()
          .transform((val) => (val === undefined ? null : val)),
        cloudBaseFtMsl: z.coerce
          .number()
          .optional()
          .transform((val) => (val === undefined ? null : val)),
        cloudTopFtMsl: z.coerce
          .number()
          .optional()
          .transform((val) => (val === undefined ? null : val)),
      }),
    )
    .optional()
    .transform((val) => (val === undefined ? null : val)),

  turbulenceCondition: z
    .object({
      turbulenceIntensity: z
        .string()
        .optional()
        .transform((val) => (val === undefined ? null : val)),
    })
    .optional()
    .transform((val) => (val === undefined ? null : val)),
  icingCondition: z
    .object({
      icingIntensity: z
        .string()
        .optional()
        .transform((val) => (val === undefined ? null : val)),
    })
    .optional()
    .transform((val) => (val === undefined ? null : val)),
});
