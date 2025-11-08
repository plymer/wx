import { z } from "zod";
import { GOES_PRODUCTS, RADAR_PRODUCTS } from "../config/wms.config.js";

export const radarProductSchema = z.strictObject({
  product: z.enum(RADAR_PRODUCTS),
});

export const goesProductSchema = z.strictObject({
  domain: z.enum(["east", "west"]),
  product: z.enum(GOES_PRODUCTS),
});

export const realtimeLayersSchema = z.strictObject({
  layer: z.string().trim(),
});
