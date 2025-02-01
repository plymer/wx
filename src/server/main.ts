// third-party dependencies
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFile } from "node:fs/promises";

// custom types and utilities
import { injectViteDevServer } from "./lib/utils.js";

const isProd = process.env.NODE_ENV === "production";

// get the content of the index.html so we can serve it from the root
let html = await readFile("index.html", "utf8");

// inject vite dev server if we're not in production mode
if (!isProd) html = injectViteDevServer(html);

// create the server instance
const app = new Hono();
app.get("/", (c) => c.html(html));

// <--- ADD ENDPOINTS BELOW THIS LINE ---> //

app.get("/api/hello", (c) => c.json({ greeting: "hello" }));

// this has to be last in registration order, so that our vite app is only served as the last-possible option

// <--- ADD ENDPOINTS ABOVE THIS LINE ---> //

// if we are in production, serve the app
if (isProd)
  serve({ ...app, port: 3000 }, (info) =>
    console.log("\x1b[32m", `✅ server running at http://localhost:${info.port}\n`)
  );
// else console.log("\x1b[32m", `✅ server running at http://localhost:${process.env.PORT}\n`);

// this is exported so that the vite dev server can access this hono instance
export default app;
