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
