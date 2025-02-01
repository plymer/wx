import { ZodSchema } from "zod";
import type { ValidationTargets } from "hono";
import { zValidator as zv } from "@hono/zod-validator";

export const validateParams = <T extends ZodSchema, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
  documentation: Object
) =>
  zv(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          status: "error",
          message: "invalid input",
          error: result.error.issues.map((i) => i),
          documentation: documentation,
        },
        400
      );
    }
  });
