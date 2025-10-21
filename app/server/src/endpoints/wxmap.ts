import { and, eq, gt, inArray } from "drizzle-orm";
import type { Feature, Point } from "geojson";

import type { MetarData, MetarWithStation, SfcObsPopupBundle, StationPlotData } from "../lib/types.js";
import { metars, stations, tafs } from "../db/tables/avwx.drizzle.js";
import { HOUR } from "../lib/constants.js";

import { wxmapMetarSchema } from "../validationSchemas/wxmap.zod.js";

// // Generic function to convert METAR query results to GeoJSON features
// function buildMetarFeatures(queryResult: MetarWithStation[]): Feature<Point, StationPlotData>[] {
//   return queryResult.reduce<Feature<Point, StationPlotData>[]>((acc, metar) => {
//     // destructure the fields we want to use from the metar
//     const { siteId, category, td, tt, vis, validTime, wxString, windDir, windGst, windSpd, stations } = metar;

//     // skip if no coordinates
//     if (!stations?.lat || !stations?.lon) {
//       return acc;
//     }

//     const { lat, lon } = stations;

//     // check to see if we already have a feature for this siteId
//     const existingFeature = acc.find((feature) => feature.properties.siteId === siteId);

//     const metarData: Omit<MetarData, "siteId" | "rawText"> = {
//       category,
//       td,
//       tt,
//       vis,
//       validTime,
//       wxString,
//       windDir,
//       windGst,
//       windSpd,
//     };

//     // if we do, lets add the metar data to the existing feature's properties
//     if (existingFeature) {
//       existingFeature.properties.metars.push(metarData);
//     } else {
//       // create a new feature for this siteId
//       const newFeature: Feature<Point, StationPlotData> = {
//         type: "Feature",
//         geometry: {
//           type: "Point",
//           coordinates: [lon, lat],
//         },
//         properties: {
//           siteId,
//           metars: [metarData],
//         },
//       };
//       acc.push(newFeature);
//     }

//     return acc;
//   }, []);
// }

// route.get("/wxmap/metars", async (c) => {
//   if (!avwx) {
//     console.error("[API] No avwx connection available.");
//     return errorResponse(c, "No avwx connection available.");
//   }

//   const queryResult = (await avwx.query.metars.findMany({
//     where: gt(metars.validTime, new Date(Date.now() - 4 * HOUR)),
//     with: { stations: { columns: { lat: true, lon: true } } },
//   })) as MetarWithStation[]; // Type assertion for the query result

//   const metarFeatures = buildMetarFeatures(queryResult);

//   return jsonResponse(c, metarFeatures, "geojson");
// });

// route.get("/wxmap/popup", validateParams("query", wxmapMetarSchema), async (c) => {
//   if (!avwx) {
//     console.error("[API] No avwx connection available.");
//     return errorResponse(c, "No avwx connection available.");
//   }

//   // this will allow for the incremental updating of metar data for all of the stations on the map via a payload-merge
//   const { siteId } = c.req.valid("query");

//   const combinedQuery = await avwx
//     .select({
//       siteId: stations.siteId,
//       siteName: stations.name,
//       siteCountry: stations.country,
//       siteState: stations.state,
//       metarText: metars.rawText,
//       tafText: tafs.rawText,
//     })
//     .from(stations)
//     .leftJoin(metars, and(eq(stations.siteId, metars.siteId), gt(metars.validTime, new Date(Date.now() - 2 * HOUR))))
//     .leftJoin(tafs, and(eq(stations.siteId, tafs.siteId), gt(tafs.validTime, new Date(Date.now() - 6 * HOUR))))
//     .where(inArray(stations.siteId, siteId));

//   // lets group the results by siteId and return an array of rawText strings for each siteId

//   return jsonResponse(
//     c,
//     combinedQuery.reduce<SfcObsPopupBundle>((acc, m) => {
//       if (!m.metarText) return acc;
//       if (!acc[m.siteId]) {
//         acc[m.siteId] = {
//           metaData: { siteName: null, siteCountry: null, siteState: null },
//           metars: [],
//           tafs: [],
//         };
//       }
//       acc[m.siteId].metaData = { siteName: m.siteName, siteCountry: m.siteCountry, siteState: m.siteState };
//       acc[m.siteId].metars.push(m.metarText);
//       if (m.tafText) acc[m.siteId].tafs.push(m.tafText);

//       return acc;
//     }, {}),
//   );
// });

// export default route;
