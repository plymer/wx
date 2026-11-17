import "dotenv/config";
import { gt, lt } from "drizzle-orm";
import { sigmets } from "../db/schemas.drizzle.js";
import { HOUR } from "../lib/constants.js";
import type { CacheSigmetsData, DataProcessResult, SigmetData, XMLCacheFile } from "../lib/types.js";
import { xmlParser } from "../lib/utils.js";
import { awcSigmetsSchema } from "../lib/validation.js";
import { pgDb as db } from "../services/database.js";
import { readGzipFile } from "./read-gzip.js";

const RESOURCE_URL = "https://aviationweather.gov/data/cache/sigmets.cache.xml.gz";

export async function getSigmets(): Promise<DataProcessResult> {
  if (!db) {
    throw new Error("[SIGMET] Database connection failed.");
  }

  let wasError = false;

  const xml = await readGzipFile(RESOURCE_URL, "sigmet", true);

  if (xml === null) {
    console.error("[SIGMET] Error - data was null");
    return { result: "error" };
  }

  const { parser } = xmlParser();

  const sigmetData = (parser.parse(xml) as XMLCacheFile<CacheSigmetsData, "sigmet">).response.data.sigmet;

  const parsedSigmets = sigmetData
    .map((sigmet) => {
      const parsed = awcSigmetsSchema.safeParse(sigmet);

      if (!parsed.success) {
        console.error(parsed.error);
        return;
      }
      const {
        altitude,
        area,
        hazard,
        rawText,
        validTimeFrom,
        validTimeTo,
        fir,
        seriesId,
        movementDir,
        movementSpdKt,
        change,
      } = parsed.data;

      const issueTime = new Date(validTimeFrom);
      const endTime = new Date(validTimeTo);
      const header = rawText.slice(0, 6);
      const domain = header.slice(2, 4);
      const initialShape = "polygon";
      const issuer = rawText.slice(7, 11);
      const firRegion = fir;

      const initialCoords = area?.point.map((p) => [p.latitude, p.longitude]).join(" ") ?? null;

      const hazardTop =
        typeof altitude !== "string" && altitude?.topFtMsl
          ? `FL${(altitude.topFtMsl / 100).toString().padStart(3, "0")}`
          : null;
      const hazardBottom =
        typeof altitude !== "string" && altitude?.baseFtMsl
          ? `FL${(altitude.baseFtMsl / 100).toString().padStart(3, "0")}`
          : null;

      const speed = movementSpdKt ?? 0;

      const charCode = seriesId.match(/\D+/g) ? seriesId.match(/\D+/g)![0].trim() : fir;
      const numberCode = seriesId.match(/\d+/g) ? parseInt(seriesId.match(/\d+/g)![0]) : null;

      if (!charCode || !numberCode) {
        console.error(`[SIGMET] Could not parse SIGMET identifier from series ID: ${seriesId}`);
        return;
      }

      const hazardName =
        hazard.type === "TC" || hazard.type === "VA" ? hazard.qualifier?.replace("ERUPTION", "").trim() : null;

      const outputObject: SigmetData = {
        issueTime,
        endTime,
        rawText,
        header,
        domain,
        issuer,
        charCode,
        numberCode,
        firRegion,
        initialCoords,
        initialShape,
        direction: movementDir,
        speed,
        hazard: hazard.type === "CONVECTIVE" ? "TS" : hazard.type,
        hazardName: hazardName ?? null,
        hazardTop,
        hazardBottom,
        finalCoords: null,
        hazardTrend: change ?? "NC",
      };

      return outputObject;
    })
    .filter((v): v is SigmetData => v !== undefined);

  const now = new Date();

  // get SIGMET events from the last 6 hours
  const recentSigmets = await db
    .select()
    .from(sigmets)
    .where(gt(sigmets.issueTime, new Date(now.getTime() - 6 * HOUR))); // Last 6 hours

  // find which SIGMETs are still active in the DB so we can diff the AWC API response against them
  const activeInDb = recentSigmets.filter((s) => s.endTime > now);

  // Helper function to check if a SIGMET should be cancelled
  const shouldCancelSigmet = (dbSigmet: SigmetData) => {
    // Don't cancel if already cancelled
    if (dbSigmet.rawText.includes("CNL")) return false;

    // Don't cancel if exact match exists in API
    const exactMatch = parsedSigmets.find(
      (apiSigmet) =>
        apiSigmet.charCode === dbSigmet.charCode &&
        apiSigmet.domain === dbSigmet.domain &&
        apiSigmet.numberCode === dbSigmet.numberCode,
    );
    if (exactMatch) return false;

    // Don't cancel if newer SIGMET exists in API
    const newerExists = parsedSigmets.find(
      (apiSigmet) =>
        apiSigmet.charCode === dbSigmet.charCode &&
        apiSigmet.domain === dbSigmet.domain &&
        apiSigmet.numberCode &&
        dbSigmet.numberCode &&
        apiSigmet.numberCode > dbSigmet.numberCode,
    );
    if (newerExists) return false;

    // Don't cancel if cancellation already exists
    const cancellationExists = recentSigmets.find(
      (existingSigmet) =>
        existingSigmet.charCode === dbSigmet.charCode &&
        existingSigmet.domain === dbSigmet.domain &&
        existingSigmet.numberCode === dbSigmet.numberCode! + 1 &&
        existingSigmet.rawText.includes("CNL"),
    );
    if (cancellationExists) return false;

    return true;
  };

  // before we return, we need to create those fake cancellations for any SIGMETs that have disappeared from the API but are still active in the DB
  const toCancel = activeInDb.filter(shouldCancelSigmet);

  toCancel.forEach((sigmet) => {
    console.info(
      `[SIGMET] SIGMET ${sigmet.domain} ${sigmet.charCode} ${
        sigmet.numberCode
      } is active in the database but missing from the AWC API, creating a cancellation...`,
    );

    const fakeCancel = {
      issuer: sigmet.issuer,
      firRegion: sigmet.firRegion,
      domain: sigmet.domain,
      header: sigmet.header,
      charCode: sigmet.charCode,
      numberCode: sigmet.numberCode + 1,
      issueTime: now,
      endTime: now,
      rawText: `CNL ${sigmet.charCode}${sigmet.numberCode} ${sigmet.issuer} ${sigmet.firRegion} - THIS SIGMET HAS BEEN CANCELLED AUTOMATICALLY BY THE DATA HANDLER`,
    } as SigmetData;

    parsedSigmets.push(fakeCancel);
  });

  try {
    await Promise.allSettled(
      parsedSigmets.map(async (sigmet) => {
        await db!.insert(sigmets).values(sigmet).onConflictDoNothing();
      }),
    );
    // console.log(`[SIGMET] Inserted/updated ${data.length} SIGMETs.`);
  } catch (error) {
    console.error(`[SIGMET] Could not insert SIGMETs into the database: ${(error as Error).message}`);
    wasError = true;
  }

  // console.log(`[SIGMET] Cleaning up old data...`);

  try {
    await db.delete(sigmets).where(lt(sigmets.endTime, new Date(Date.now() - 12 * HOUR)));
    // console.log(`[SIGMET] Old data cleanup complete.`);
  } catch (error) {
    console.error(`[SIGMET] Could not clean up old SIGMETs in the database: ${(error as Error).message}`);
    wasError = true;
  }

  if (wasError) {
    return { result: "error" };
  } else {
    return { result: "success" };
  }
}
