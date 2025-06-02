import { Hono } from "hono";
import axios from "axios";
import { Feature, FeatureCollection, Point } from "geojson";
import { LightningFC } from "../lib/lightning.types.js";

const route = new Hono();

route.get("/lightning", async (ctx) => {
  // first, lets get our current minutes from the current UTC time
  const latestTime = new Date().getUTCMinutes();

  // lightning data is binned into 6-minute intervals, so we need to round down to the nearest 6-minute mark
  const roundedMinutes = Math.floor(latestTime / 6) * 6;

  const searchStartTime = new Date();
  searchStartTime.setUTCMinutes(roundedMinutes);
  searchStartTime.setUTCSeconds(0);
  searchStartTime.setUTCMilliseconds(0);

  // our search time is in the format YYYY-MM-DD_HHMMSS
  // we want to loop back every 6 minutes for the last 3 hours and return all of the lightning data
  // we'll create an array of timestamps to fetch
  const timeStamps = [];
  for (let i = 0; i < 32; i++) {
    const time = new Date(searchStartTime.getTime() - i * 6 * 60 * 1000);
    const formattedTime = time
      .toISOString() //
      .replace(/.\d+Z$/g, "")
      .replace("T", "_")
      .replace(/:/g, ""); // replace the colons with nothing to match the format YYYY-MM-DD_HHMMSS
    timeStamps.push(formattedTime);
  }

  const urlList = timeStamps.map((ts) => `https://weather.gc.ca/api/app/v2/Lightning/1/${ts}`);

  try {
    const responses = await Promise.all(
      urlList.map((url) =>
        axios
          .get(url)
          .then((res) => res.data as LightningFC)
          .catch((err) => {
            console.error(`Error fetching data from ${url}:`, err);
            return null; // Return null for failed requests
          })
      )
    );

    // keep track of all of the features we find
    const features: Feature[] = [];

    // so now we need to collapse all of features into a single FeatureCollection with a 'validTime' property
    responses.forEach((res) => {
      if (!res) return null; // Skip null responses

      // prefer dateTo if available, otherwise use timeStamp
      const validTime = new Date(res.dateTo || res.timeStamp).getTime();

      // gather all of the coordinates from the features
      const coords = res.features.map((feature) => (feature.geometry as Point).coordinates);

      features.push({
        type: "Feature",
        geometry: { type: "MultiPoint", coordinates: coords },
        properties: {
          validTime,
        },
      });
    });

    if (features.length === 0) return ctx.json({ status: "noData" }, 200);

    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: features,
    };

    return ctx.json({ status: "success", data: output }, 200);
  } catch (error) {
    return ctx.json({ status: "error", message: error }, 500);
  }
});

export default route;
