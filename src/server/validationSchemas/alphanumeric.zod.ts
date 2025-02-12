import { z } from "zod";
import { DEFAULT_METARS_HOURS } from "../config/alphanumeric.config.js";

export const metarSchema = z.object({
  site: z.string().trim(),
  hrs: z.coerce.number().default(DEFAULT_METARS_HOURS),
});

export const singleSiteSchema = z.object({ site: z.string().trim() });
