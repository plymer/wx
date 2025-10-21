// third-party dependencies
import "dotenv/config";

import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";

// database schemas
import * as aqDbSchema from "./db/tables/aq.drizzle.js";
import * as avwxSchemas from "./db/tables/avwx.drizzle.js";
import * as avwxRelations from "./db/relations/avwx.relations.drizzle.js";

// utilities
import { generateDbConnection } from "./lib/utils.js";

// endpoint routers
import { aqRouter } from "./endpoints/aq.js";
import { lightningRouter } from "./endpoints/lightning.js";
import { wmsRouter } from "./endpoints/wms.js";
import { wxmapRouter } from "./endpoints/wxmap.js";
import { alphanumericRouter } from "./endpoints/alphanumeric.js";
import { chartsRouter } from "./endpoints/charts.js";
import z from "zod";
import { publicProcedure, router } from "./lib/trpc.js";

// database connections
// export const aqDb = await generateDbConnection("aq", aqDbSchema);
const avwxCombinedSchema = {
  ...avwxSchemas,
  ...avwxRelations,
};
export const avwxDb = await generateDbConnection("avwx", avwxCombinedSchema);

// Merge all routers into the main app router
// const appRouter = router({
//   alphanumericRouter,
// });

const greetRouter = router({
  greeting: publicProcedure
    .input(
      z
        .object({
          name: z.string().nullish(),
        })
        .nullish(),
    )
    .query(async ({ input }) => {
      return `Hello, ${input?.name ?? "world!"}`;
    }),
});

const appRouter = router({
  base: greetRouter,
  alpha: alphanumericRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

createHTTPServer({
  middleware: cors(),
  router: appRouter,
  // basePath: "/api",
}).listen(3000);

console.log(`tRPC server listening on http://localhost:3000`);
