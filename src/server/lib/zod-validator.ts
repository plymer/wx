import { ZodType } from "zod";
import type { ValidationTargets } from "hono";
import { zValidator as zv } from "@hono/zod-validator";

export const validateParams = <T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) =>
  zv(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          status: "error",
          message: "invalid input",
          error: result.error.issues.map((i) => i),
        },
        400,
      );
    }
  });
