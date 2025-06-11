// third-party dependencies
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFileSync } from "fs";
import "dotenv/config";

// endpoint imports
import { default as geomet } from "./endpoints/geomet.js";
import { default as alpha } from "./endpoints/alphanumeric.js";
import { default as charts } from "./endpoints/charts.js";
import { default as lightning } from "./endpoints/lightning.js";
import { default as aq } from "./endpoints/aq.js";

// database schemas
import * as aqSchema from "./dbSchemas/aq.drizzle.js";

// custom types and utilities
import { generateDbConnection, injectViteDevServer } from "./lib/utils.js";

const isProd = process.env.NODE_ENV === "production";

export const aqDb = await generateDbConnection("aq", aqSchema);

// get the content of the index.html so we can serve it from the root
// TODO :: set this up to serve all files out of /dist just like in the HubWx implementation
let html = readFileSync(isProd ? "dist/index.html" : "index.html", "utf8");

// inject vite dev server if we're not in production mode
if (!isProd) html = injectViteDevServer(html);

// create the server instance
const app = new Hono({ strict: false });

app.get("/assets/*", serveStatic({ root: isProd ? "./dist" : "./" }));
app.get("/*", serveStatic({ root: isProd ? "./dist" : "./" }));

// add our api routes here
app.route("/api", geomet);
app.route("/api/alpha", alpha);
app.route("/api/charts", charts);
app.route("/api", lightning);

// add our db-dependent routes only if the database connection is successful
if (aqDb) app.route("/api", aq);

// we can pretty this up like we did internally at some point
// return a list of all the API routes thay are active
app.get("/api", (c) => {
  const routes = app.routes.map((route) => route.path);
  const uniqueRoutes = Array.from(new Set(routes))
    .filter((r) => r.includes("/api"))
    .sort();
  return c.json(uniqueRoutes, 200);
});

// serve the SPA page
app.get("/", (c) => c.html(html));

// if we are in production, serve the app
if (isProd)
  serve({ ...app, port: 3000 }, (info) =>
    console.log("\x1b[32m", `✅ server running at http://localhost:${info.port}\n`),
  );

// this is exported so that the vite dev server can access this hono instance
export default app;
