// third-party dependencies
import "dotenv/config";

import z from "zod";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { serve } from "@hono/node-server";

// database schemas
import * as pgSchemas from "./db/tables/pg.drizzle.js";

// utilities
import { redisClient } from "./services/redis.js";
import { publicProcedure, router } from "./services/trpc.js";

// endpoint routers
import { wmsRouter } from "./endpoints/wms.js";
import { wxmapRouter } from "./endpoints/wxmap.js";
import { alphanumericRouter } from "./endpoints/alphanumeric.js";
import { chartsRouter } from "./endpoints/charts.js";
import { globalMessageRouter } from "./endpoints/globalMessage.js";
import { apiRouter } from "./endpoints/api.js";

import { DatabaseConnection } from "./services/pg-db.js";

const app = new Hono();

app.use("*", cors());

const port = parseInt(process.env.PORT || "3000");

const pgDbConnection = new DatabaseConnection(pgSchemas, "api");
export const db = await pgDbConnection.getDb();

export const cacheClient = await redisClient("api");

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

  wms: wmsRouter,
  wxmap: wxmapRouter,
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  }),
);

app.route("/api", apiRouter);

// serve the app
serve({ fetch: app.fetch, port });

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

export default app;

console.log(`[API] Hono server listening on http://localhost:${port}/api/`);
console.log(`[API] tRPC server listening on http://localhost:${port}/trpc/`);
