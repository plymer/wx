// third-party dependencies
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { readFileSync } from "fs";

// endpoint imports
import { default as geomet } from "./endpoints/geomet.js";
import { default as alpha } from "./endpoints/alphanumeric.js";
import { default as charts } from "./endpoints/charts.js";

// custom types and utilities
import { injectViteDevServer } from "./lib/utils.js";

const isProd = process.env.NODE_ENV === "production";

// get the content of the index.html so we can serve it from the root
// TODO :: set this up to serve all files out of /dist just like in the HubWx implementation
let html = readFileSync("index.html", "utf8");

// inject vite dev server if we're not in production mode
if (!isProd) html = injectViteDevServer(html);

// create the server instance
const app = new Hono();

// add our api routes here
app.route("/api", geomet);
app.route("/api/alpha", alpha);
app.route("/api/charts", charts);

// serve the SPA page
app.get("/", (c) => c.html(html));

// if we are in production, serve the app
if (isProd)
  serve({ ...app, port: 3000 }, (info) =>
    console.log("\x1b[32m", `✅ server running at http://localhost:${info.port}\n`)
  );

// this is exported so that the vite dev server can access this hono instance
export default app;
