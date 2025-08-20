import { z } from "zod";

export const wxmapMetarSchema = z.strictObject({
  id: z.coerce.number().default(0),
});
