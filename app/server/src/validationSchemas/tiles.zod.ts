import { z } from "zod";

export const tileSchema = z.object({
  t: z.number().int().nonnegative(),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  z: z.number().int().nonnegative(),
});
