import { z } from "zod";

export const realtimeLayersSchema = z.object({
  layers: z.string().trim(),
});
