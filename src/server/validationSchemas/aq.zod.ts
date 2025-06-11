import { z } from "zod";

export const aqSchema = z
  .object({
    hours: z.coerce
      .number({
        message: "Number of hours to look back and retrieve data. Defaults to 4.",
        description: "a number from 1 to 24",
      })
      .min(1)
      .max(24)
      .default(4),
  })
  .strict();
