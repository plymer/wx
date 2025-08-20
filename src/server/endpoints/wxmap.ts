import { Hono } from "hono";
import { errorResponse, jsonResponse } from "../lib/utils";
import { avwx } from "../main.js";
import { validateParams } from "../lib/zod-validator";
import { wxmapMetarSchema } from "../validationSchemas/wxmap.zod";
// import * as fs from "fs";

const route = new Hono();

route.get("/wxmap/metars", async (c) => {
  if (!avwx) {
    console.error("[API] No avwx connection available.");
    return errorResponse(c, "No avwx connection available.");
  }

  // fs.readFileSync(``, "utf-8");

  // this will return the 'payload' of metars to popuplate the station data on the map

  return jsonResponse(c, { message: "PAYLOAD - This endpoint is not implemented yet." });
});

route.get("/wxmap/metars/:id", validateParams("param", wxmapMetarSchema), async (c) => {
  if (!avwx) {
    console.error("[API] No avwx connection available.");
    return errorResponse(c, "No avwx connection available.");
  }
  // this will allow for the incremental updating of metar data for all of the stations on the map via a payload-merge
  const { id } = c.req.valid("param");

  return jsonResponse(c, { message: `Metars since the ${id}` });
});

export default route;
