import { z } from "zod";
import { DEFAULT_METARS_HOURS } from "../config/alphanumeric.config.js";

export const metarSchema = z.strictObject({
  site: z.string().toUpperCase().trim(),
  hrs: z.coerce.number().default(DEFAULT_METARS_HOURS),
});

export const singleSiteSchema = z.strictObject({
  site: z
    .string()
    .toUpperCase()
    .trim()
    .regex(/^[A-Z0-9]+$/),
});

export const publicBulletinSchema = z.strictObject({
  bulletin: z.string().toLowerCase().trim(),
  office: z.string().toLowerCase().trim(),
});

export const publicPointSchema = z.strictObject({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export const xmetSchema = z
  .object({
    hours: z.coerce.number().default(1),
  })
  .strict();
