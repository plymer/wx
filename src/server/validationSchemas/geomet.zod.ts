import { z } from "zod";

export const realtimeLayersSchema = z.strictObject({
  layers: z
    .string({ error: "Layers must be a comma-separated list of layer names." })
    .trim()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((layer) => layer.trim())
            .filter(Boolean)
        : undefined,
    ),
});
