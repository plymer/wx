// third-party dependencies
import "dotenv/config";

import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { router, publicProcedure } from "./trpc.js";
import { z } from "zod";

// endpoint imports

// database schemas
import * as aqSchema from "@wx/shared/db/tables/aq.drizzle.js";
import * as avwxSchemas from "@wx/shared/db/tables/avwx.drizzle.js";
import * as avwxRelations from "@wx/shared/db/relations/avwx.relations.drizzle.js";

// custom types and utilities
import { generateDbConnection } from "@wx/shared/lib/utils.js";

export const aqDb = await generateDbConnection("aq", aqSchema);
const avwxCombinedSchema = {
  ...avwxSchemas,
  ...avwxRelations,
};

const appRouter = router({
  greeting: publicProcedure
    // This is the input schema of your procedure
    // 💡 Tip: Try changing this and see type errors on the client straight away
    .input(
      z
        .object({
          name: z.string().nullish(),
        })
        .nullish(),
    )
    .query(async ({ input }) => {
      // This is what you're returning to your client

      return {
        text: `Hello, ${input?.name ?? "world!"}`,
        // 💡 Tip: Try adding a new property here and see it propagate to the client straight-away
      };
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

createHTTPServer({
  middleware: cors(),
  router: appRouter,
  basePath: "./api",
}).listen(3000);

console.log(`tRPC server listening on http://localhost:3000/api`);
