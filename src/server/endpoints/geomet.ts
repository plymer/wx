import { DOMParser, LiveNodeList } from "@xmldom/xmldom";
import axios from "axios";
import { coordinateTimes } from "../lib/utils.js";

import { Hono } from "hono";
import { validateParams } from "../lib/zod-validator.js";
import { realtimeLayersSchema } from "../validationSchemas/geomet.zod.js";
import { LayerProperties } from "../lib/geomet.types.js";
import { GEOMET_GETCAPABILITIES_RT } from "../config/geomet.config.js";

const getTypes = (keywords: LiveNodeList) => {
  const results = [...keywords].map((kw) => [...kw.childNodes].map((cn) => cn.nodeValue).toString());

  return results.filter((kw) => kw === "Satellite images" || kw === "Radar").toString();
};

// create the route

const route = new Hono();

route.get("/geomet", validateParams("query", realtimeLayersSchema, {}), async (c) => {
  try {
    const parser = new DOMParser();

    const { layers, mode, frames } = c.req.valid("query");

    // parse the layers requested into separate strings
    const searches = layers.split(",");

    const xml = await axios.get(GEOMET_GETCAPABILITIES_RT).then((response) => response.data);

    const options = parser
      .parseFromString(xml, "application/xml")
      .getElementsByTagName("Capability")[0]
      .getElementsByTagName("Layer");

    const capabilities = [...options]
      .map((l, i) =>
        l.getAttribute("opaque") && l.hasChildNodes() && l.getElementsByTagName("Dimension")
          ? {
              name: l.getElementsByTagName("Name")[0].childNodes[0].nodeValue,
              dimension: l.getElementsByTagName("Dimension")[0].childNodes[0].nodeValue,
              domain:
                l.parentElement?.getElementsByTagName("Name")[0].childNodes[0].nodeValue?.toLowerCase() ===
                "north american radar composite [1 km]"
                  ? "national"
                  : l.parentElement?.getElementsByTagName("Name")[0].childNodes[0].nodeValue?.toLowerCase(),
              type: getTypes(l.getElementsByTagName("Keyword")) === "Satellite images" ? "satellite" : "radar",
            }
          : ""
      )
      .filter((v) => v !== "") as LayerProperties[];

    // console.log(capabilities);

    // give the option to search all possible layers with a search param of 'layers=all'\
    // otherwise, return the requested layer details
    let output =
      layers === "all"
        ? capabilities
        : (searches.map((layer) => capabilities.find((c) => c.name === layer)) as LayerProperties[]);

    // if we have chosen to coordinate all of the layer times, do that now
    let formattedOutput =
      layers !== "all"
        ? coordinateTimes(
            output.map((l) => l),
            frames,
            mode
          )
        : output;

    c.json({ status: "success", ...formattedOutput }, 200);
  } catch (error) {
    c.json({ status: "error", message: error }, 400);
  }
});

export default route;
