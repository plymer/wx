// third-party libraries
import { Hono } from "hono";
import { XMLParser } from "fast-xml-parser";
import axios from "axios";

// data-shapes
import { LayerProperties } from "../lib/geomet.types.js";

// utility functions
import { processDimensionString, transformName } from "../lib/utils.js";

// configuration files
import { GEOMET_GETCAPABILITIES } from "../config/geomet.config.js";

// input validation
import { validateParams } from "../lib/zod-validator.js";
import { realtimeLayersSchema } from "../validationSchemas/geomet.zod.js";

// create a new hono instance that we will bind our endpoints to
// don't forget to add 'export default route' at the bottom of this file
const route = new Hono();

route.get("/geomet", validateParams("query", realtimeLayersSchema, {}), async (ctx) => {
  // get our validated query parameters from our GET request context
  const { layers } = ctx.req.valid("query");
  try {
    // configure the XML parser to make traversing the XML easier
    const newParser = new XMLParser({
      removeNSPrefix: true,
      ignoreAttributes: false,
      textNodeName: "value",
      attributeNamePrefix: "",
      transformAttributeName: (attrName) => transformName(attrName),
      transformTagName: (tagName) => transformName(tagName),
    });

    // parse the layers requested into separate strings
    const searches = layers ? layers.split(",") : undefined;

    // fetch and parse the xml from the GET_CAPABILITIES endpoint on GeoMet
    const xml = await axios
      .get(GEOMET_GETCAPABILITIES)
      .then((response) => response.data)
      .then((data) => newParser.parse(data));

    // find all of the layer categories available on the server
    const layerCategories = xml.WMS_Capabilities.Capability.Layer.Layer.map((layer: any) => layer.Layer)
      .flat()
      .map((cat: any) => cat);

    // filter out the layers that pertain to the radar and build the list object
    const radarLayers = layerCategories
      .filter((layers: any) => layers.Name === "North American radar composite [1 km]")
      .flat()[0]
      .Layer.map((layer: any) => {
        return { name: layer.Name, dimension: layer.Dimension.value, domain: "national", type: "radar" };
      });

    // filter out the layers that pertain to the satellite and build the list object
    // the logic here differs because the satellite layers are nested by domain (east/west)
    const satelliteLayers = layerCategories
      .filter((layers: any) => layers.Name === "Geostationary Operational Environmental Satellite (GOES)")
      .flat()[0]
      .Layer.map((domain: any) => domain)
      .map((domain: any) => {
        const props = { domain: domain.Name.toLowerCase(), type: "satellite" };
        return domain.Layer.map((layer: any) => {
          return { name: layer.Name, dimension: layer.Dimension.value, ...props };
        });
      })
      .flat();

    // combine all of our filtered layer list objects into a single array
    const allLayers = [...radarLayers, ...satelliteLayers];

    // filter out the layers that were requested by the user and calculate the time steps
    const output = searches
      ? allLayers
          .filter((layer: LayerProperties) => searches.includes(layer.name))
          .map((layer) => {
            const timesSteps = processDimensionString(layer.dimension);
            return { ...layer, timeSteps: timesSteps };
          })
      : allLayers;

    return ctx.json({ status: "success", data: output }, 200);
  } catch (error) {
    return ctx.json({ status: "error", message: error }, 200);
  }
});

// create all endpoints above this export
// it is used in the /src/main.ts file and bound to the main hono instance
export default route;
