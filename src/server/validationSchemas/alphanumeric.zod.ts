import { z } from "zod";
import { DEFAULT_METARS_HOURS } from "../config/alphanumeric.config.js";

export const metarSchema = z
  .object({
    site: z
      .string()
      .trim()
      .transform((val) => val.toUpperCase()),
    hrs: z.coerce.number().default(DEFAULT_METARS_HOURS),
  })
  .strict();

export const singleSiteSchema = z
  .object({
    site: z
      .string()
      .trim()
      .transform((val) => val.toUpperCase()),
  })
  .strict();

export const publicBulletinSchema = z
  .object({
    bulletin: z.string().trim(),
    office: z.string().trim(),
  })
  .strict();
