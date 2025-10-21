import axios from "axios";
import { TRPCError } from "@trpc/server";

import type { WMSLayer } from "../lib/types.js";
import { processDimensionString } from "../lib/utils.js";
import { DATA_CUTOFF, EUMETSAT_GETCAPABILITIES, GEOMET_GETCAPABILITIES } from "../config/wms.config.js";
import { realtimeLayersSchema } from "../validationSchemas/wms.zod.js";
import { WMSXMLParser } from "../lib/xml-parser.js";
import { publicProcedure, router } from "../lib/trpc.js";

export const wmsRouter = router({
  geomet: publicProcedure.input(realtimeLayersSchema).query(async ({ input }) => {
    const { layers } = input;

    try {
      const { parser } = new WMSXMLParser();

      const xml = await axios
        .get(GEOMET_GETCAPABILITIES)
        .then((response) => response.data)
        .then((data) => parser.parse(data));

      const layerCategories = xml.wmsCapabilities.capability.layer.layer
        .map((layer: any) => layer.layer)
        .flat()
        .map((cat: any) => cat);

      const radarLayers: WMSLayer[] = layerCategories
        .filter((layers: any) => layers.name === "North American radar composite [1 km]")
        .flat()[0]
        .layer.map((layer: any) => {
          return { name: layer.name, dimension: layer.dimension.value, domain: "national", type: "radar" };
        });

      const satelliteLayers: WMSLayer[] = layerCategories
        .filter((layers: any) => layers.name === "Geostationary Operational Environmental Satellite (GOES)")
        .flat()[0]
        .layer.map((domain: any) => domain)
        .flatMap((domain: any) => {
          const props = { domain: domain.name.toLowerCase(), type: "satellite" };
          return domain.layer.map((layer: any) => {
            return { name: layer.name, dimension: layer.dimension.value, ...props };
          });
        });

      const allLayers = [...radarLayers, ...satelliteLayers];
      const dataCutoff = Date.now() - DATA_CUTOFF;

      const output = layers
        ? allLayers
            .filter((layer) => layers.includes(layer.name))
            .map((layer) => {
              const timesSteps = processDimensionString(layer.dimension).filter((time) => time.validTime >= dataCutoff);
              return { ...layer, timeSteps: timesSteps };
            })
        : allLayers;

      return output;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  eumetsat: publicProcedure.input(realtimeLayersSchema).query(async ({ input }) => {
    const { layers } = input;

    try {
      const { parser } = new WMSXMLParser();

      const xml = await axios
        .get(EUMETSAT_GETCAPABILITIES)
        .then((response) => response.data)
        .then((data) => parser.parse(data));

      const allLayers: WMSLayer[] = xml.wmsCapabilities.capability.layer.layer
        .filter((layer: any) => layer.title.includes("- 0 degree"))
        .map((layer: any) => {
          return {
            name: layer.name,
            title: layer.title,
            dimension: layer.dimension.value,
            domain: "europe",
            type: "satellite",
          } as WMSLayer;
        });

      const dataCutoff = Date.now() - DATA_CUTOFF;

      const output = layers
        ? allLayers
            .filter((layer) => layers.includes(layer.name))
            .map((layer) => {
              const timesSteps = processDimensionString(layer.dimension).filter((time) => time.validTime >= dataCutoff);
              return { ...layer, timeSteps: timesSteps };
            })
        : allLayers;

      return output;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
});
