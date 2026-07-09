import { z } from "zod";

export const tileSchema = z.object({
  t: z.coerce.number(),
  x: z.coerce.number(),
  y: z.coerce.number(),
  z: z.coerce.number(),
});
