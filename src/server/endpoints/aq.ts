import { Hono } from "hono";
import { gte } from "drizzle-orm";
import type { Feature, Point } from "geojson";

import { aqDb } from "../main.js";
import { aqData } from "../../shared/db/schemas/aq.drizzle.js";
import { errorResponse, HOUR, jsonResponse } from "../lib/utils.js";

import { validateParams } from "../lib/zod-validator.js";
import { aqSchema } from "../validationSchemas/aq.zod.js";

const route = new Hono();

route.get("/aq", validateParams("query", aqSchema), async (c) => {
  // assert our database connection
  const db = aqDb!;

  // get our validated query parameters
  const { hours } = c.req.valid("query");

  console.log(`Fetching AQ data from the last ${hours} hours(s)...`);

  const then = new Date(new Date().getTime() - hours * HOUR);

  try {
    // make our query
    const data = await db.query.aqData.findMany({
      where: gte(aqData.validTime, then),
    });

    // create our GeoJSON FeatureCollection
    const geoData = data.reduce((acc: Array<Feature<Point>>, item) => {
      if (!item.lat || !item.lon) {
        console.warn(`Skipping item with missing coordinates: ${JSON.stringify(item)}`);
        return acc;
      }

      const output: Feature<Point> = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [item.lon, item.lat],
        },
        properties: {
          name: item.name,
          type: item.type,
          pm25: item.pm25,
          validTime: item.validTime,
        },
      };

      acc.push(output);
      return acc;
    }, []);

    return jsonResponse(c, geoData, "geojson");
  } catch (error) {
    return errorResponse(c, error);
  }
});

export default route;
