import { z } from "zod";

export const aqSchema = z.strictObject({
  hours: z.coerce
    .number({
      error: "Number (1-24) of hours to look back and retrieve data. Defaults to 4.",
    })
    .min(1)
    .max(24)
    .default(4),
});
