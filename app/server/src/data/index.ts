import { generateDbConnection } from "../lib/utils.js";
import { getAqData } from "./aq-data.js";
import { getMetars } from "./metars.js";
// import { getPireps } from "./pireps.js";
import { getPublicAlerts } from "./public-alerts.js";
import { getSigmets } from "./sigmets.js";
import { getTafs } from "./tafs.js";
import { createIsolines } from "./isolines.js";

import * as schemas from "../db/tables/data.drizzle.js";
import * as relations from "../db/relations/data.relations.drizzle.js";
import { runFromCron, TaskQueue, type DataTask } from "../services/queue.js";
import { buildStationCatalog } from "./stations.js";
import { redisClient } from "../services/redis.js";
import { DatabaseConnection } from "../services/pg-db.js";
import {
  metars,
  tafs,
  stations,
  stationVisibility,
  isobars,
  lightning,
  aqData,
  sigmets,
  stationsRelations,
  metarsRelations,
  tafsRelations,
  metarsTemporalView,
} from "../db/tables/pg.drizzle.js";

export const cacheClient = await redisClient("data");

const pgSchema = {
  metars,
  tafs,
  stations,
  stationVisibility,
  isobars,
  lightning,
  aqData,
  sigmets,
  stationsRelations,
  metarsRelations,
  tafsRelations,
  metarsTemporalView,
} as const;

/**
 * This function orchestrates the running of all data fetches such that we don't overwhelm the server's resources and crash due to OOM errors. We will have a max concurrency of 2 processes, adding a new fetch once the queue is down to 1.
 */
async function main() {
  const MAX_CONCURRENCY = 2;

  const sqliteDb = await generateDbConnection({ ...schemas, ...relations }, "data");
  const pgDbConnection = new DatabaseConnection(pgSchema);
  const pgDb = await pgDbConnection.getDb();

  const currentTime = new Date();
  const currentMinute = currentTime.getUTCMinutes();
  const currentHour = currentTime.getUTCHours();

  const queue = new TaskQueue(MAX_CONCURRENCY);
  const tasks: DataTask[] = [
    { name: "TAFs", run: () => getTafs(sqliteDb), schedule: "*/5 * * * *" },
    { name: "METARs", run: () => getMetars(pgDb), schedule: "* * * * *" },
    // { name: "PIREPs", run: () => getPireps(db), schedule: "* * * * *" },
    { name: "SIGMETs", run: () => getSigmets(sqliteDb), schedule: "* * * * *" },
    { name: "Public-Alerts", run: () => getPublicAlerts(), schedule: "* * * * *" },
    { name: "AQ-Data", run: () => getAqData(sqliteDb), schedule: "*/10 * * * *" },
    { name: "Isolines", run: () => createIsolines(sqliteDb), schedule: "*/10 * * * *" },
    { name: "Station-Catalog", run: () => buildStationCatalog(), schedule: "0 0 * * *" },
  ].filter((task) => runFromCron(task.schedule, currentMinute, currentHour));

  console.log(
    `[DATA] Starting data refresh (max concurrent ${MAX_CONCURRENCY}) - ${tasks.map((t) => t.name).join(", ")}`,
  );
  const startedAt = performance.now();

  const results = await Promise.allSettled(tasks.map((task) => queue.push(task.name, task.run)));
  const failures = results.filter((result) => result.status === "rejected");
  const elapsedMs = Math.round(performance.now() - startedAt);

  console.log(
    `[DATA] Summary: total=${tasks.length} succeeded=${tasks.length - failures.length} failed=${failures.length} elapsed=${elapsedMs}ms`,
  );

  if (failures.length > 0) {
    console.error(`[DATA] Completed with ${failures.length} task failure(s).`);
    process.exit(1);
  }

  process.exit(0);
}

main();
