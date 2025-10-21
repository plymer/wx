import { z } from "zod";

export const wxmapMetarSchema = z.strictObject({
  siteId: z
    .string()
    .min(4)
    .transform((val) => val.split(",").map((v) => v.trim().toUpperCase()))
    .optional(),
});
