// third-party libraries
import { Hono } from "hono";
import { DOMParser, LiveNodeList } from "@xmldom/xmldom";
import axios from "axios";

// data-shapes
import { LayerProperties } from "../lib/geomet.types.js";

// utility functions

// configuration files

// input validation
import { validateParams } from "../lib/zod-validator.js";
import { realtimeLayersSchema } from "../validationSchemas/geomet.zod.js";

// endpoint documentation
import { processDimensionString } from "../lib/utils.js";
import { GEOMET_GETCAPABILITIES_RT } from "../config/geomet.config.js";

// create a new hono instance that we will bind our endpoints to
// don't forget to add 'export default route' at the bottom of this file
const route = new Hono();

const getTypes = (keywords: LiveNodeList) => {
  const results = [...keywords].map((kw) => [...kw.childNodes].map((cn) => cn.nodeValue).toString());

  return results.filter((kw) => kw === "Satellite images" || kw === "Radar").toString();
};

route.get("/geomet", validateParams("query", realtimeLayersSchema, {}), async (ctx) => {
  // get our validated query parameters from our GET request context
  const { layers } = ctx.req.valid("query");
  try {
    const parser = new DOMParser();

    // parse the layers requested into separate strings
    const searches = layers.split(",");

    const xml = await axios.get(GEOMET_GETCAPABILITIES_RT).then((response) => response.data);

    const options = parser
      .parseFromString(xml, "application/xml")
      .getElementsByTagName("Capability")[0]
      .getElementsByTagName("Layer");

    const capabilities = [...options]
      .map((layer, i) =>
        layer.getAttribute("opaque") && layer.hasChildNodes() && layer.getElementsByTagName("Dimension")
          ? {
              name: layer.getElementsByTagName("Name")[0].childNodes[0].nodeValue,
              dimension: layer.getElementsByTagName("Dimension")[0].childNodes[0].nodeValue,
              domain:
                layer.parentElement?.getElementsByTagName("Name")[0].childNodes[0].nodeValue?.toLowerCase() ===
                  "north american radar composite [1 km]" ||
                layer.parentElement?.getElementsByTagName("Name")[0].childNodes[0].nodeValue?.toLowerCase() ===
                  "north american radar surface precipitation type [1 km]"
                  ? "national"
                  : layer.parentElement?.getElementsByTagName("Name")[0].childNodes[0].nodeValue?.toLowerCase(),
              type: getTypes(layer.getElementsByTagName("Keyword")) === "Satellite images" ? "satellite" : "radar",
            }
          : ""
      )
      .filter((v) => v !== "") as LayerProperties[];

    // console.log(capabilities);

    // give the option to search all possible layers with a search param of 'layers=all'
    // otherwise, return the requested layer details
    const layerCollection: LayerProperties[] =
      layers === "all"
        ? capabilities
        : (searches.map((layer) => capabilities.find((c) => c.name === layer)) as LayerProperties[]);

    // build out the time steps the layers in the output
    const output: LayerProperties[] =
      layerCollection &&
      layerCollection.map((layer) => ({
        ...layer,
        timeSteps: layer?.dimension ? processDimensionString(layer.dimension) : [],
      }));

    return ctx.json({ status: "success", data: output }, 200);
  } catch (error) {
    return ctx.json({ status: "error", message: error }, 200);
  }
});

// create all endpoints above this export
// it is used in the /src/main.ts file and bound to the main hono instance
export default route;
