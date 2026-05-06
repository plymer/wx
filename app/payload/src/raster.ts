#!/usr/bin/node

import * as fs from "fs";

// this file will generate the realtime GeoMet definitions for Radar and Satellite raster data

async function main() {
  console.log("\x1b[0m%s\x1b[0m", `ℹ️ Info: Generating realtime raster definition file...`);

  // check our environment
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    console.log("\x1b[0m%s\x1b[0m", "ℹ️ Info: Running in development mode, payloads will be fetched from the dev API");

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  // in production, we save the payloads to a static directory otherwise save to a local directory for testing
  const outputPath = process.env.NODE_ENV === "production" ? "/projects/data/cmacw/static/wxmap-payload" : "./output";

  console.log("\x1b[0m%s\x1b[0m", "ℹ️ Info: Payload files will be saved to", outputPath);

  const fileName = "geomet-payload-realtime.json";

  try {
    console.log("\x1b[0m%s\x1b[0m", `ℹ️ Info: Starting file generation...`);

    const data = await fetch(
      isProd
        ? "http://localhost:3000/geomet/realtime"
        : "http://edcm-mscapps-dev.edc-mtl.ec.gc.ca/cmac-api/geomet/realtime",
    ).then((res) => res.json());

    fs.existsSync(outputPath) || fs.mkdirSync(outputPath);
    fs.writeFileSync(`${outputPath}/${fileName}`, JSON.stringify(data));

    const fileSize = (fs.statSync(`${outputPath}/${fileName}`).size / (1024 * 1024)).toFixed(2) + " MB";

    console.log(
      "\x1b[32m%s\x1b[0m",
      `✅ Success: Realtime payload file written successfully to\n\t${outputPath}/${fileName} (${fileSize})`,
    );
  } catch (error) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "❌ Error: Failed while creating realtime payload files:\n\n",
      (error as Error).message,
    );
  }
}

main();
