import { z } from "zod";
import { GEOMET_MODES } from "../lib/geomet.types.js";

export const realtimeLayersSchema = z.object({
  layers: z.string().trim(),
  mode: z.enum(GEOMET_MODES).default("current"),
  frames: z.coerce.number().default(18),
});
