import { z } from "zod";
import { GOES_PRODUCTS, HIMARWARI_PRODUCTS, RADAR_PRODUCTS } from "../config/wms.config.js";

export const radarProductSchema = z.strictObject({
  product: z.enum(RADAR_PRODUCTS),
});

export const goesProductSchema = z.strictObject({
  domain: z.enum(["east", "west"]),
  product: z.enum(GOES_PRODUCTS),
});

export const himawariProductSchema = z.strictObject({
  product: z.enum(HIMARWARI_PRODUCTS),
});

export const eumetsatProductSchema = z.strictObject({
  domain: z.enum(["europe", "indianOcean"]),
  product: z.enum(["mtg_fd:rgb_fog", "msg_iodc:rgb_fog", "msg_fes:rgb_ash", "msg_iodc:rgb_ash"]),
});

export const nowcoastProductSchema = z.strictObject({
  product: z.enum([
    "goes_longwave_imagery",
    "goes_shortwave_imagery",
    "goes_visible_imagery",
    "goes_water_vapor_imagery",
  ]),
});

export const realtimeLayersSchema = z.strictObject({
  layer: z.string().trim(),
});
