import { z } from "zod";
import { GOES_PRODUCTS, RADAR_PRODUCTS } from "../config/wms.config.js";

export const radarProductSchema = z.strictObject({
  product: z.enum(RADAR_PRODUCTS),
});

export const goesProductSchema = z.strictObject({
  domain: z.enum(["east", "west"]),
  product: z.enum(GOES_PRODUCTS),
});

export const eumetsatProductSchema = z.strictObject({
  domain: z.enum(["europe", "indianOcean"]),
  product: z.enum(["mtg_fd:rgb_fog", "msg_iodc:rgb_fog"]),
});

export const realtimeLayersSchema = z.strictObject({
  layer: z.string().trim(),
});
