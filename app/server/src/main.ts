// third-party dependencies
import "dotenv/config";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import z from "zod";

// database schemas
import * as schemas from "./db/tables/data.drizzle.js";
import * as relations from "./db/relations/data.relations.drizzle.js";

// utilities
import { generateDbConnection } from "./lib/utils.js";
import { redisClient } from "./lib/redis.js";
import { publicProcedure, router } from "./lib/trpc.js";

// endpoint routers
import { aqRouter } from "./endpoints/aq.js";
import { lightningRouter } from "./endpoints/lightning.js";
import { wmsRouter } from "./endpoints/wms.js";
import { wxmapRouter } from "./endpoints/wxmap.js";
import { alphanumericRouter } from "./endpoints/alphanumeric.js";
import { chartsRouter } from "./endpoints/charts.js";
import { globalMessageRouter } from "./endpoints/globalMessage.js";

const PORT = process.env.PORT || 3000;

export const db = await generateDbConnection(
  {
    ...schemas,
    ...relations,
  },
  "api",
);

export const cacheClient = await redisClient();

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
  messages: globalMessageRouter,
  alpha: alphanumericRouter,
  charts: chartsRouter,
  lightning: lightningRouter,
  wms: wmsRouter,
  wxmap: wxmapRouter,
  aq: aqRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

createHTTPServer({
  middleware: cors(),
  router: appRouter,
  basePath: "/api/",
}).listen(PORT);

console.log(`[API] tRPC server listening on http://localhost:${PORT}/api/`);
