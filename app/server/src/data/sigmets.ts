import "dotenv/config";
import { gt, lt } from "drizzle-orm";
import { sigmets } from "../db/tables/data.drizzle.js";
import { DEFAULT_LETTER_ID, DEFAULT_NUMBER_ID, HOUR } from "../lib/constants.js";
import type { CacheAirSigmetsData, Coords, RawIntlSigmetData, SigmetData, XMLCacheFile } from "../lib/types.js";
import { cardinalToDegrees, generateDbConnection, readGzipFile, xmlParser } from "../lib/utils.js";
import { airSigmetsSchema } from "../lib/validation.js";

const RESOURCE_URL = "https://aviationweather.gov/data/cache/airsigmets.cache.xml.gz";

async function main() {
  const db = await generateDbConnection({ sigmets }, "sigmet");

  if (!db) {
    console.error(`[SIGMET] Database connection failed.`);
    process.exit(1);
  }

  const xml = await readGzipFile(RESOURCE_URL, "sigmet");

  const { parser } = xmlParser();

  const conusData = (parser.parse(xml) as XMLCacheFile<CacheAirSigmetsData, "airsigmet">).response.data.airsigmet;

  const parsedConusData = Array.isArray(conusData) ? conusData : [conusData];

  const conusOutput: SigmetData[] = [];

  try {
    const output: SigmetData[] = parsedConusData
      .map((sigmet) => {
        const parsed = airSigmetsSchema.safeParse(sigmet);

        if (!parsed.success) {
          console.error(parsed.error);
          return;
        }
        const { altitude, area, hazard, rawText, validTimeFrom, validTimeTo } = parsed.data;

        const issueTime = new Date(validTimeFrom);
        const endTime = new Date(validTimeTo);
        const header = rawText.slice(0, 6);
        const domain = header.slice(2, 4);
        const initialShape = "polygon";
        const issuer = rawText.slice(7, 11);
        const firRegion = rawText.slice(20, 24);

        const initialCoords = area?.point.map((p) => [p.latitude, p.longitude]).join(" ") ?? null;

        const hazardTop = altitude?.maxFtMsl ? `FL${(altitude.maxFtMsl / 100).toString().padStart(3, "0")}` : null;
        const hazardBottom = altitude?.minFtMsl ? `FL${(altitude.minFtMsl / 100).toString().padStart(3, "0")}` : null;

        const movement = rawText.match(/(?:MOV )(LTL|FROM)( \d{5}KT)?/g);

        const direction =
          movement && movement[0].includes("LTL") ? 0 : movement ? (parseInt(movement[0].slice(9, 12)) + 180) % 360 : 0;

        const speed = movement && movement[0].includes("LTL") ? 0 : movement ? parseInt(movement[0].slice(12, 14)) : 0;

        const sigmetIdentifier = rawText
          .match(/(?:SIGMET)(.+\n)/g)![0]
          ?.replace("SIGMET", "")
          .trim();

        const charCode =
          sigmetIdentifier && sigmetIdentifier.match(/\D+/g) ? sigmetIdentifier.match(/\D+/g)![0].trim() : null;
        const numberCode =
          sigmetIdentifier && sigmetIdentifier.match(/\d+/g) ? parseInt(sigmetIdentifier.match(/\d+/g)![0]) : null;

        if (!charCode || !numberCode) {
          console.error(`[SIGMET] Could not parse SIGMET identifier from raw text: ${rawText}`);
          return;
        }

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
          direction,
          speed,
          hazard: hazard.type === "CONVECTIVE" ? "TS" : hazard.type,
          hazardTop,
          hazardBottom,
          finalCoords: null,
          hazardTrend: null,
        };

        return outputObject;
      })
      .filter((v): v is SigmetData => v !== undefined);

    conusOutput.push(...output);
  } catch (error) {
    throw new Error(`[SIGMET] Could not parse SIGMETs from the AWC XML: ${(error as Error).message}`);
  }

  const avwxApi = "https://aviationweather.gov/api/data/";

  const now = new Date();

  // get SIGMET events from the last 6 hours in the AK/PN/NT domains that were NOT issued by CWAO (CONUS) - we only want int'l SIGMETs from this feed
  const recentSigmets = await db
    .select()
    .from(sigmets)
    .where(gt(sigmets.issueTime, new Date(now.getTime() - 6 * HOUR))); // Last 6 hours

  // find which SIGMETs are still active in the DB so we can diff the AWC API response against them
  const activeInDb = recentSigmets.filter((s) => s.endTime > now);

  const intlData = await fetch(`${avwxApi}isigmet?format=json`, { headers: { "User-Agent": "prairiewx/1.0" } })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `[SIGMET] Failed to fetch international SIGMET data\n${response.status} ${response.statusText}`,
        );
      }
      return response.json();
    })
    .then((data) => data as RawIntlSigmetData[]);

  const data = intlData
    .filter((sigmet) => sigmet !== undefined || sigmet !== null)
    .map((sigmet) => {
      const {
        firId,
        icaoId,
        dir,
        seriesId,
        validTimeFrom,
        validTimeTo,
        spd,
        rawSigmet: rawText,
        hazard,
        base,
        top,
        chng,
        coords,
      } = sigmet;

      // skip the SIGMET if it doesn't have coordinates
      if (!coords) {
        return undefined;
      }

      // some int'l FIRs don't use a letter but they use a number, some don't use a number but use a letter, and some use both
      const charCode = seriesId && seriesId.match(/\D+/g) ? seriesId.match(/\D+/g)![0].trim() : DEFAULT_LETTER_ID;
      const numberCode = seriesId && seriesId.match(/\d+/g) ? parseInt(seriesId.match(/\d+/g)![0]) : DEFAULT_NUMBER_ID;

      const issueTime = new Date(validTimeFrom * 1000);
      const endTime = new Date(validTimeTo * 1000);

      // the AWC API just provides precomputed polygons
      const initialShape = "polygon";

      const hazardBottom = (() => {
        if (base === null || base === undefined) return null; // handle strictly null/undefined
        if (base === 0) return "SFC"; // handle 0 as SFC
        if (typeof base === "number" && !isNaN(base) && base > 0) {
          return `FL${(base / 100).toString().padStart(3, "0")}`;
        }
        return null;
      })();

      const hazardTop = top && !isNaN(top) ? `FL${(top / 100).toString().padStart(3, "0")}` : null;

      // AWC does some wierd stuff where they do both initial and final areas in one coords array, so we need to handle that
      const origCoords = Array.isArray(coords[0])
        ? (coords as Coords[][]).map((subgeom) => subgeom.map((pair) => [pair.lat, pair.lon]).join(" "))
        : (coords as Coords[]).map((pair) => [pair.lat, pair.lon]).join(" ");

      const initialCoords = Array.isArray(origCoords) ? origCoords[0] : origCoords;
      const finalCoords = Array.isArray(origCoords) && origCoords.length > 1 ? origCoords[1] : null;

      const header = rawText.slice(0, 6);

      const domain = header.slice(2, 4);

      const direction = dir ? cardinalToDegrees(dir) : 0;

      const speed = (() => {
        if (!spd) return 0;
        if (typeof spd === "number") return spd;
        if (!isNaN(parseInt(spd))) return parseInt(spd);
        if (spd === "STNR") return 0;
        if (spd === "UNK") return 10; // assign unknown a nominal speed of 10 knots
        return 0;
      })();

      const values: SigmetData = {
        issuer: icaoId,
        firRegion: firId,
        issueTime,
        endTime,
        header,
        domain,
        charCode,
        numberCode,
        hazard,
        hazardTrend: chng,
        hazardBottom,
        hazardTop,
        initialShape,
        direction,
        speed,
        initialCoords,
        finalCoords,
        rawText,
      };

      return values;
    })
    .filter((v): v is SigmetData => v !== undefined);

  // add the CONUS output to the intl output array
  data.push(...conusOutput);

  // Helper function to check if a SIGMET should be cancelled
  const shouldCancelSigmet = (dbSigmet: SigmetData) => {
    // Don't cancel if already cancelled
    if (dbSigmet.rawText.includes("CNL")) return false;

    // Don't cancel if exact match exists in API
    const exactMatch = data.find(
      (apiSigmet) =>
        apiSigmet.charCode === dbSigmet.charCode &&
        apiSigmet.domain === dbSigmet.domain &&
        apiSigmet.numberCode === dbSigmet.numberCode,
    );
    if (exactMatch) return false;

    // Don't cancel if newer SIGMET exists in API
    const newerExists = data.find(
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
    console.warn(
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

    data.push(fakeCancel);
  });

  try {
    await Promise.allSettled(
      data.map(async (sigmet) => {
        await db.insert(sigmets).values(sigmet).onConflictDoNothing();
      }),
    );
    console.log(`[SIGMET] Inserted/updated ${data.length} SIGMETs.`);
  } catch (error) {
    throw new Error(`[SIGMET] Could not insert SIGMETs into the database: ${(error as Error).message}`);
  }

  console.log(`[SIGMET] Cleaning up old data...`);

  try {
    await db.delete(sigmets).where(lt(sigmets.endTime, new Date(Date.now() - 12 * HOUR)));
    console.log(`[SIGMET] Old data cleanup complete.`);
    process.exit(0);
  } catch (error) {
    throw new Error(`[SIGMET] Could not clean up old SIGMETs in the database: ${(error as Error).message}`);
  }
}

await main();
