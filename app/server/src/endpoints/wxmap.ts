import { and, eq, gt, inArray } from "drizzle-orm";
import type { Feature, Point } from "geojson";
import { TRPCError } from "@trpc/server";

import type { MetarData, MetarWithStation, SfcObsPopupBundle, StationPlotData } from "../lib/types.js";
import { metars, stations, tafs } from "../db/tables/avwx.drizzle.js";
import { HOUR } from "../lib/constants.js";
import { wxmapMetarSchema } from "../validationSchemas/wxmap.zod.js";
import { router, publicProcedure } from "../lib/trpc.js";
import { avwxDb } from "../main.js";

// Generic function to convert METAR query results to GeoJSON features
function buildMetarFeatures(queryResult: MetarWithStation[]): Feature<Point, StationPlotData>[] {
  return queryResult.reduce<Feature<Point, StationPlotData>[]>((acc, metar) => {
    const { siteId, category, td, tt, vis, validTime, wxString, windDir, windGst, windSpd, stations } = metar;

    if (!stations?.lat || !stations?.lon) {
      return acc;
    }

    const { lat, lon } = stations;
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

    if (existingFeature) {
      existingFeature.properties.metars.push(metarData);
    } else {
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

export const wxmapRouter = router({
  wxmapMetars: publicProcedure.query(async () => {
    if (!avwxDb) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No avwx connection available" });
    }

    const queryResult = (await avwxDb.query.metars.findMany({
      where: gt(metars.validTime, new Date(Date.now() - 4 * HOUR)),
      with: { stations: { columns: { lat: true, lon: true } } },
    })) as MetarWithStation[];

    const metarFeatures = buildMetarFeatures(queryResult);

    return metarFeatures;
  }),

  wxmapPopup: publicProcedure.input(wxmapMetarSchema).query(async ({ input }) => {
    if (!avwxDb) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No avwx connection available" });
    }

    const { siteId } = input;

    const combinedQuery = await avwxDb
      .select({
        siteId: stations.siteId,
        siteName: stations.name,
        siteCountry: stations.country,
        siteState: stations.state,
        metarText: metars.rawText,
        tafText: tafs.rawText,
      })
      .from(stations)
      .leftJoin(metars, and(eq(stations.siteId, metars.siteId), gt(metars.validTime, new Date(Date.now() - 2 * HOUR))))
      .leftJoin(tafs, and(eq(stations.siteId, tafs.siteId), gt(tafs.validTime, new Date(Date.now() - 6 * HOUR))))
      .where(inArray(stations.siteId, siteId));

    return combinedQuery.reduce<SfcObsPopupBundle>((acc, m) => {
      if (!m.metarText) return acc;
      if (!acc[m.siteId]) {
        acc[m.siteId] = {
          metaData: { siteName: null, siteCountry: null, siteState: null },
          metars: [],
          tafs: [],
        };
      }
      acc[m.siteId].metaData = { siteName: m.siteName, siteCountry: m.siteCountry, siteState: m.siteState };
      acc[m.siteId].metars.push(m.metarText);
      if (m.tafText) acc[m.siteId].tafs.push(m.tafText);

      return acc;
    }, {});
  }),
});
