import { generateDbConnection } from "../lib/utils.js";
import { getAqData } from "./aq-data.js";
import { getMetars } from "./metars.js";
import { getPireps } from "./pireps.js";
import { getPublicAlerts } from "./public-alerts.js";
import { getSigmets } from "./sigmets.js";
import { getTafs } from "./tafs.js";

import * as schemas from "../db/tables/data.drizzle.js";
import * as relations from "../db/relations/data.relations.drizzle.js";
import { runFromCron, TaskQueue, type DataTask } from "../lib/queue.js";
import { buildStationCatalog } from "./stations.js";
import { generateVectorTiles } from "./vector-tiles.js";
import { getLightning } from "./lightning.js";

/**
 * This function orchestrates the running of all data fetches such that we don't overwhelm the server's resources and crash due to OOM errors. We will have a max concurrency of 2 processes, adding a new fetch once the queue is down to 1.
 */
async function main() {
  const MAX_CONCURRENCY = 2;
  const MAX_RUN_TIME_MS = 55 * 1000;

  const db = await generateDbConnection({ ...schemas, ...relations }, "data");

  const currentTime = new Date();
  const currentMinute = currentTime.getUTCMinutes();
  const currentHour = currentTime.getUTCHours();

  const queue = new TaskQueue(MAX_CONCURRENCY);
  const tasks: DataTask[] = [
    { name: "TAFs", run: () => getTafs(db), schedule: "*/5 * * * *", enabled: true },
    { name: "METARs", run: () => getMetars(db), schedule: "* * * * *", enabled: true },
    { name: "Lightning", run: () => getLightning(db), schedule: "* * * * *", enabled: true },
    {
      name: "Vector Tiles",
      run: () => generateVectorTiles(db),
      schedule: "* * * * *",
      dependsOn: ["TAFs", "METARs", "Lightning"],
      enabled: false,
    },
    { name: "PIREPs", run: () => getPireps(db), schedule: "* * * * *", enabled: false },
    { name: "SIGMETs", run: () => getSigmets(db), schedule: "* * * * *", enabled: true },
    { name: "Public Alerts", run: () => getPublicAlerts(), schedule: "* * * * *", enabled: true },
    { name: "AQ Data", run: () => getAqData(db), schedule: "*/10 * * * *", enabled: true },

    { name: "Station Catalog", run: () => buildStationCatalog(), schedule: "0 0 * * *", enabled: true },
  ].filter((task) => runFromCron(task.schedule, currentMinute, currentHour) && task.enabled); // filter by cron schedule and enabled flag

  console.log(
    `[DATA] Starting data refresh (tasks: ${tasks.length} / max concurrent ${MAX_CONCURRENCY}) - ${tasks.map((t) => t.name).join(", ")}`,
  );
  const startedAt = performance.now();

  // enforce a hard timeout after 55 seconds to avoid overlap and OOM errors
  const abortTimeout = setTimeout(() => {
    console.error(`[DATA] Aborting refresh after ${MAX_RUN_TIME_MS}ms max runtime.`);
    process.exit(1);
  }, MAX_RUN_TIME_MS);

  const results = await Promise.allSettled(tasks.map((task) => queue.push(task.name, task.run, task.dependsOn)));

  clearTimeout(abortTimeout); // clear the timeout when we finish all tasks

  const failures = results.filter((result) => result.status === "rejected");
  const elapsedMs = Math.round(performance.now() - startedAt);

  console.log(
    `[DATA] Data Cycle Complete\nSucceeded: ${tasks.length - failures.length}/${tasks.length} ✅\nFailed: ${failures.length}/${tasks.length} ❌\nTime: ${elapsedMs}ms ⏱️`,
  );

  if (failures.length > 0) {
    console.warn(`[DATA] ❌ Failed Tasks: ${failures.join(", ")}`);
  }

  process.exit(0);
}

main();
