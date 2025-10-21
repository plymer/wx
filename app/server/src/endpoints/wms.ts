import axios from "axios";

// data-shapes
import type { WMSLayer } from "../lib/types.js";

// utility functions
import { processDimensionString } from "../lib/utils.js";

// configuration files
import { DATA_CUTOFF, EUMETSAT_GETCAPABILITIES, GEOMET_GETCAPABILITIES } from "../config/wms.config.js";

// input validation

import { realtimeLayersSchema } from "../validationSchemas/wms.zod.js";
import { WMSXMLParser } from "../lib/xml-parser.js";
import { HOUR } from "../lib/constants.js";

// route.get("/geomet", validateParams("query", realtimeLayersSchema), async (c) => {
//   // get our validated query parameters from our GET request context
//   const { layers } = c.req.valid("query");
//   try {
//     // get outselves a parser instance pre-configured for the WMS XML structure
//     const { parser } = new WMSXMLParser();

//     // fetch and parse the xml from the GET_CAPABILITIES endpoint on GeoMet
//     const xml = await axios
//       .get(GEOMET_GETCAPABILITIES)
//       .then((response) => response.data)
//       .then((data) => parser.parse(data));

//     // find all of the layer categories available on the server
//     const layerCategories = xml.wmsCapabilities.capability.layer.layer
//       .map((layer: any) => layer.layer)
//       .flat()
//       .map((cat: any) => cat);

//     // filter out the layers that pertain to the radar and build the list object
//     const radarLayers: WMSLayer[] = layerCategories
//       .filter((layers: any) => layers.name === "North American radar composite [1 km]")
//       .flat()[0]
//       .layer.map((layer: any) => {
//         return { name: layer.name, dimension: layer.dimension.value, domain: "national", type: "radar" };
//       });

//     // filter out the layers that pertain to the satellite and build the list object
//     // the logic here differs because the satellite layers are nested by domain (east/west)
//     const satelliteLayers: WMSLayer[] = layerCategories
//       .filter((layers: any) => layers.name === "Geostationary Operational Environmental Satellite (GOES)")
//       .flat()[0]
//       .layer.map((domain: any) => domain)
//       .flatMap((domain: any) => {
//         const props = { domain: domain.name.toLowerCase(), type: "satellite" };
//         return domain.layer.map((layer: any) => {
//           return { name: layer.name, dimension: layer.dimension.value, ...props };
//         });
//       });

//     // combine all of our filtered layer list objects into a single array
//     const allLayers = [...radarLayers, ...satelliteLayers];

//     // we need to make sure we are only returning timesteps for the last 4 hours
//     const dataCutoff = Date.now() - DATA_CUTOFF;

//     const output = layers
//       ? allLayers
//           .filter((layer) => layers.includes(layer.name))
//           .map((layer) => {
//             const timesSteps = processDimensionString(layer.dimension).filter((time) => time.validTime >= dataCutoff);

//             return { ...layer, timeSteps: timesSteps };
//           })
//       : allLayers;

//     return jsonResponse(c, output);
//   } catch (error) {
//     return errorResponse(c, error);
//   }
// });

// route.get("/eumetsat", validateParams("query", realtimeLayersSchema), async (c) => {
//   const { layers } = c.req.valid("query");

//   try {
//     // get outselves a parser instance pre-configured for the WMS XML structure
//     const { parser } = new WMSXMLParser();

//     // fetch and parse the xml from the GET_CAPABILITIES endpoint at EUMETSAT
//     const xml = await axios
//       .get(EUMETSAT_GETCAPABILITIES)
//       .then((response) => response.data)
//       .then((data) => parser.parse(data));

//     const allLayers: WMSLayer[] = xml.wmsCapabilities.capability.layer.layer
//       .filter((layer: any) => layer.title.includes("- 0 degree"))
//       .map((layer: any) => {
//         return {
//           name: layer.name,
//           title: layer.title,
//           dimension: layer.dimension.value,
//           domain: "europe",
//           type: "satellite",
//         } as WMSLayer;
//       });

//     // we need to make sure we are only returning timesteps for the last 4 hours
//     const dataCutoff = Date.now() - DATA_CUTOFF;

//     const output = layers
//       ? allLayers
//           .filter((layer) => layers.includes(layer.name))
//           .map((layer) => {
//             const timesSteps = processDimensionString(layer.dimension).filter((time) => time.validTime >= dataCutoff);

//             return { ...layer, timeSteps: timesSteps };
//           })
//       : allLayers;

//     return jsonResponse(c, output);
//   } catch (error) {
//     return errorResponse(c, error);
//   }
// });

// // create all endpoints above this export
// // it is used in the /src/main.ts file and bound to the main hono instance
// export default route;
