import { eq, sql } from "drizzle-orm";
import { pgDb as db } from "../services/database.js";
import { stations as stationsSchema } from "../db/schemas.drizzle.js";

// prettier-ignore
const BC_WINDS = ["CWAS","CWFG","CWRU","CWRO","CWEK","CWME","CWRO","CWQS","CWQK"]

// prettier-ignore
const OTHER_LOCAL_EFFECTS = ["CWRR","CWGM","CWNR","CZPC","CWRT","CYJF"];

// prettier-ignore
const HIGH_ARCTIC = ["CNSG","CWEU","CWAY","CWGZ","CYLC","CNGH","CWSQ","CXSE","CNPV","CNPL","CNFR","CXWB","CYCS","CMIN","CWIL","CNBI","CWIJ","CWTD","CWJC","CWJB","CWFZ","CWQY","CZFN","CWLG","CYKD","CXTV","CWOI","CYXQ",];

// prettier-ignore
const PRIORITY_STATIONS = ["CBBC","CWSA","CYAB","CYAH","CYAM","CYAS","CYAT","CYAW","CYAY","CYAZ","CYBB","CYBC","CYBG","CYBK","CYBL","CYBN","CYBR","CYBW","CYBX","CYCA","CYCB","CYCD","CYCG","CYCO","CYCX","CYCY","CYDA","CYDB","CYDF","CYDL","CYDN","CYDP","CYDQ","CYED","CYEG","CYEK","CYEN","CYER","CYEU","CYEV","CYFB","CYFC","CYFS","CYGH","CYGK","CYGL","CYGP","CYGQ","CYGR","CYGT","CYGV","CYGW","CYGX","CYHA","CYHD","CYHI","CYHK","CYHM","CYHU","CYHY","CYHZ","CYIK","CYIO","CYIV","CYJT","CYKA","CYKF","CYKG","CYKJ","CYKL","CYKQ","CYLD","CYLK","CYLL","CYLT","CYLW","CYMA","CYMH","CYMJ","CYMM","CYMO","CYMT","CYMX","CYNA","CYND","CYNE","CYOC","CYOD","CYOJ","CYOO","CYOW","CYOY","CYPA","CYPC","CYPE","CYPG","CYPH","CYPL","CYPQ","CYPR","CYPX","CYPY","CYQA","CYQB","CYQD","CYQF","CYQG","CYQH","CYQI","CYQK","CYQL","CYQM","CYQQ","CYQR","CYQT","CYQU","CYQV","CYQW","CYQX","CYQY","CYQZ","CYRA","CYRB","CYRJ","CYRL","CYRQ","CYRT","CYSB","CYSC","CYSF","CYSJ","CYSM","CYSN","CYSP","CYSY","CYTE","CYTH","CYTL","CYTQ","CYTR","CYTS","CYTZ","CYUB","CYUL","CYUT","CYUX","CYUY","CYVC","CYVM","CYVO","CYVP","CYVQ","CYVR","CYVT","CYVV","CYWA","CYWE","CYWG","CYWH","CYWJ","CYWK","CYWL","CYXC","CYXE","CYXH","CYXJ","CYXL","CYXP","CYXR","CYXS","CYXT","CYXU","CYXX","CYXY","CYXZ","CYYB","CYYC","CYYD","CYYE","CYYF","CYYG","CYYH","CYYJ","CYYL","CYYN","CYYQ","CYYR","CYYT","CYYU","CYYY","CYYZ","CYZE","CYZF","CYZG","CYZH","CYZP","CYZR","CYZS","CYZT","CYZU","CYZV","CYZW","CYZX","CYZY","CZBF","CZFA","CZFM","CZMD","CZMT","CZSJ","CZUM","CZVL","KABE","KABI","KACT","KACY","KAGC","KAGS","KALB","KAMA","KAPN","KATL","KAUS","KAVP","KBDL","KBFI","KBGR","KBHM","KBIL","KBNA","KBOI","KBOS","KBPT","KBTM","KBTR","KBTV","KBUF","KBWG","KBWI","KCAK","KCHA","KCHS","KCLE","KCLL","KCLT","KCMH","KCOD","KCPR","KCVG","KCYS","KDAL","KDAY","KDBQ","KDCA","KDEC","KDEN","KDFW","KDLH","KDSM","KDTW","KEAU","KERI","KEUG","KEVV","KEWR","KFAR","KFAT","KFAY","KFLG","KFOE","KFWA","KGCK","KGCN","KGEG","KGFK","KGJT","KGPT","KGRB","KGRR","KGSO","KGSP","KGTF","KHIO","KHKS","KHLN","KHOU","KHPN","KHRL","KHSV","KHUL","KHVN","KIAD","KIAG","KIAH","KICT","KIDA","KIGM","KILM","KILN","KIND","KINW","KJAC","KJAN","KJFK","KLAF","KLAS","KLAX","KLBL","KLEB","KLEX","KLFT","KLGA","KLGB","KLGU","KLIT","KLRD","KMCI","KMCN","KMDT","KMDW","KMEI","KMEM","KMFD","KMGM","KMHT","KMKC","KMKE","KMOB","KMOT","KMSN","KMSO","KMSP","KMSS","KMSY","KMTJ","KNMM","KOAK","KOGD","KOKC","KOMA","KONT","KORD"];

const STATION_PRIORITY_MIN = [
  ...PRIORITY_STATIONS,
  ...HIGH_ARCTIC,
  ...BC_WINDS,
  ...OTHER_LOCAL_EFFECTS,
  "CWLY",
  "CYHE",
  "CYDC",
];

// prettier-ignore
const STATION_PRIORITY_MED = [...STATION_PRIORITY_MIN,"CXEC","CYVL","CYGE","CYRV","CYCP","CYIN","CYBD","CYPW","CWAE","KBLI","KBVS","KAWO","KLCM","KPWT","KFHR","KOMK","KSZT","KWMH","KPSC","KLWS","KALW","KHQM","KAST","KOLM","KSLE","KONP","KRDM","KOTH","KMFR","KLMT","KLKV","KBKE","KONO","KBZN","KDVL","KROX","KBDE","KTVF","KBJI","KJMS","KGWR","KDTL","KSAZ","KMZH","KGHW","KAQP","KMML","KATY","KABR","KHON","KMHE","KULM","KRAP","KRGN","KAIA","KBFF","KSNY","KLBF","KANW","KONL","KVMR","KOLU","KGRI","KLNK","KCID","KMLI","KPIA","KJVL","KUGN","KOSH","KAXA","KCWA","KRHI","KMQT","KLNL","KSAW","KDRM","KGLR","KBAX","KFNT","KLAN","KPTK","KJXN","KAZO","KBEH","KLDM","KMKG","KSJX","KSUE","KESC","KPCW","KDKK","KOLE","KOYM","KIDI","KELM","KIPT","KGTB","KSLK","KRME","KBML","KMPV","KMLT","KBHB","KAUG"];

type Station = { lon: number; lat: number; siteId: string };

/**
 * Filters out points that are too close to each other
 * @param input An array of Station objects
 * @param minDistance Minimum allowed spacing between points (in nautical miles)
 * @param seedIds An array of station IDs to prioritize
 * @returns An array of strings (station IDs from spaced points)
 */
function filterSpacedPoints(input: Station[], minDistance: number, seedIds: string[]): string[] {
  const retained: Station[] = [];
  const selected: string[] = [];
  const excludedIds = new Set(seedIds);

  // Seed retained points with already-prioritized stations so they win spacing checks.
  if (excludedIds.size > 0) {
    for (const feature of input) {
      const featureId = feature.siteId;
      if (typeof featureId === "string" && excludedIds.has(featureId)) {
        retained.push(feature);
      }
    }
  }

  for (const candidate of input) {
    const candidateId = candidate.siteId;
    if (typeof candidateId !== "string") continue;

    if (excludedIds.has(candidateId)) continue;

    const isTooClose = retained.some((existing) =>
      minDistance === 0 ? false : withinRadius(existing.lat, existing.lon, candidate.lat, candidate.lon, minDistance),
    );

    if (!isTooClose) {
      retained.push(candidate);
      excludedIds.add(candidateId);
      selected.push(candidateId);
    }
  }

  return selected;
}

/**
 * Checks if two points are within a specified radius. Units are Nautical Miles.
 * @param lat1 latitude of point 1
 * @param lon1 longitude of point 1
 * @param lat2 latitude of point 2
 * @param lon2 longitude of point 2
 * @param radius radius in nautical miles
 * @returns boolean indicating if the points are within the specified radius
 */
function withinRadius(lat1: number, lon1: number, lat2: number, lon2: number, radius: number): boolean {
  const Rmetres = 6371e3;
  const R = Rmetres / 1852; // convert to nautical miles
  const toRad = Math.PI / 180;
  const x = (lon2 - lon1) * toRad * Math.cos(((lat1 + lat2) / 2) * toRad);

  const y = (lat2 - lat1) * toRad;

  return (x * x + y * y) * R * R < radius * radius;
}

export async function updateStationVisTable() {
  console.log("Updating station table with max zooms...");

  if (!db) {
    throw new Error("[STATION-VISIBILITY] Database connection failed.");
  }

  const uniqueSitesQuery = sql`
    SELECT DISTINCT ON (site_id)
      site_id,
      ST_X(ST_Transform("geometry", 4326)) AS "lon",
      ST_Y(ST_Transform("geometry", 4326)) AS "lat"
    FROM metars
    WHERE valid_time >= NOW() - INTERVAL '24 hour'
    ORDER BY site_id, valid_time DESC
  `;

  const allData = await db.execute(uniqueSitesQuery);

  const stations: Station[] = (allData.rows as unknown as Record<string, unknown>[]).map((row) => ({
    lon: Number(row.lon),
    lat: Number(row.lat),
    siteId: String(row.siteId),
  }));

  const filterRadius = { min: 200, med: 50, high: 25, max: 0 };

  // this may not be working as intended

  const minStations = Array.from(
    new Set([...STATION_PRIORITY_MIN, ...filterSpacedPoints(stations, filterRadius.min, STATION_PRIORITY_MIN)]),
  );
  const medStations = Array.from(
    new Set([...minStations, ...filterSpacedPoints(stations, filterRadius.med, STATION_PRIORITY_MED)]),
  );
  const highStations = Array.from(
    new Set([...medStations, ...filterSpacedPoints(stations, filterRadius.high, medStations)]),
  );
  const maxStations = Array.from(
    new Set([...medStations, ...filterSpacedPoints(stations, filterRadius.max, medStations)]),
  );

  console.log("Min stations:", minStations.length);
  console.log("Med stations:", medStations.length);
  console.log("High stations:", highStations.length);
  console.log("Max stations:", maxStations.length);

  try {
    await db.transaction(async (tx) => {
      for (const siteId of maxStations) {
        await tx.update(stationsSchema).set({ minZoom: 7.5 }).where(eq(stationsSchema.siteId, siteId));
      }

      for (const siteId of highStations) {
        await tx.update(stationsSchema).set({ minZoom: 6 }).where(eq(stationsSchema.siteId, siteId));
      }

      for (const siteId of medStations) {
        await tx.update(stationsSchema).set({ minZoom: 4.5 }).where(eq(stationsSchema.siteId, siteId));
      }

      for (const siteId of minStations) {
        await tx.update(stationsSchema).set({ minZoom: 0 }).where(eq(stationsSchema.siteId, siteId));
      }
    });
  } catch (error) {
    console.error("Error inserting stations into stationVisibility table:", error);
    process.exit(1);
  }

  process.exit(0);
}
