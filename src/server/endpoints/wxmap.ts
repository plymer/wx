import { Hono } from "hono";
import { errorResponse, jsonResponse } from "../lib/utils.js";
import { avwx } from "../main.js";
import type { MetarData, MetarWithStation, StationPlotData } from "../../shared/lib/types.js";
import { gt } from "drizzle-orm";
import { metars } from "../../shared/db/tables/avwx.drizzle.js";
import { HOUR } from "../../shared/lib/constants.js";
import type { Feature, Point } from "geojson";
// import * as fs from "fs";

const route = new Hono();

// Generic function to convert METAR query results to GeoJSON features
function buildMetarFeatures(queryResult: MetarWithStation[]): Feature<Point, StationPlotData>[] {
  return queryResult.reduce<Feature<Point, StationPlotData>[]>((acc, metar) => {
    // destructure the fields we want to use from the metar
    const { siteId, category, td, tt, vis, validTime, wxString, windDir, windGst, windSpd, stations } = metar;

    // skip if no coordinates
    if (!stations?.lat || !stations?.lon) {
      return acc;
    }

    const { lat, lon } = stations;

    // check to see if we already have a feature for this siteId
    const existingFeature = acc.find((feature) => feature.properties.siteId === siteId);

    const metarData: Omit<MetarData, "siteId" | "rawText"> = {
      category,
      td,
      tt,
      vis,
      validTime,
      wxString,
      windDir,
      windGst,
      windSpd,
    };

    // if we do, lets add the metar data to the existing feature's properties
    if (existingFeature) {
      existingFeature.properties.metars.push(metarData);
    } else {
      // create a new feature for this siteId
      const newFeature: Feature<Point, StationPlotData> = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
        properties: {
          siteId,
          metars: [metarData],
        },
      };
      acc.push(newFeature);
    }

    return acc;
  }, []);
}

route.get("/wxmap/metars", async (c) => {
  if (!avwx) {
    console.error("[API] No avwx connection available.");
    return errorResponse(c, "No avwx connection available.");
  }

  const queryResult = (await avwx.query.metars.findMany({
    where: gt(metars.validTime, new Date(Date.now() - 4 * HOUR)),
    with: { stations: { columns: { lat: true, lon: true } } },
  })) as MetarWithStation[]; // Type assertion for the query result

  const metarFeatures = buildMetarFeatures(queryResult);

  return jsonResponse(c, metarFeatures, "geojson");
});

// route.get("/wxmap/metars/:id", validateParams("param", wxmapMetarSchema), async (c) => {
//   if (!avwx) {
//     console.error("[API] No avwx connection available.");
//     return errorResponse(c, "No avwx connection available.");
//   }

//   // this will allow for the incremental updating of metar data for all of the stations on the map via a payload-merge
//   const { id } = c.req.valid("param");

//   const queryResult = (await avwx.query.metars.findMany({
//     where: gt(metars.id, id),
//     with: { stations: { columns: { lat: true, lon: true } } },
//   })) as MetarWithStation[]; // Type assertion for the query result

//   const metarFeatures = buildMetarFeatures(queryResult);

//   return jsonResponse(c, metarFeatures, "geojson");
// });

export default route;
