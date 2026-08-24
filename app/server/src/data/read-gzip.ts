import { createGunzip } from "zlib";
import { DEFAULT_REMOTE_HEADERS } from "../lib/constants.js";

import { etagCheckin } from "../lib/etag.js";

export async function readGzipFile(url: string, dataType: string, skipCheckin: boolean = false) {
  try {
    if (!skipCheckin && !(await etagCheckin(url, dataType))) return null;

    // fetch the compressed data
    const arrayBuffer = await fetch(url, { headers: DEFAULT_REMOTE_HEADERS }).then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }

      return res.arrayBuffer();
    });
    const compressedData = Buffer.from(arrayBuffer);

    // decompress the data
    const decompressedData = await new Promise((resolve, reject) => {
      const gunzip = createGunzip();
      const chunks: Buffer[] = [];

      gunzip.on("data", (chunk) => chunks.push(chunk));
      gunzip.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      gunzip.on("error", (err) => reject(err));

      gunzip.write(compressedData);
      gunzip.end();
    });

    if (typeof decompressedData !== "string") {
      throw new Error(`[${dataType.toUpperCase()}] Decompressed data is not a string`);
    }

    return decompressedData;
  } catch (error) {
    console.error(`[${dataType.toUpperCase()}] Error reading gzip file:`, error);
    throw error;
  }
}
