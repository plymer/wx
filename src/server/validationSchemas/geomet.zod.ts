import { z } from "zod";

export const realtimeLayersSchema = z
  .object({
    layers: z
      .string({ message: "Layers must be a comma-separated list of layer names." })
      .trim()
      .optional()
      .transform((value) =>
        value
          ? value
              .split(",")
              .map((layer) => layer.trim())
              .filter(Boolean)
          : undefined
      ),
  })
  .strict();
