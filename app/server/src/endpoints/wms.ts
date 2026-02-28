import { TRPCError } from "@trpc/server";
import type { WMSLayer } from "../lib/types.js";
import { processDimensionString } from "../lib/utils.js";
import { DATA_CUTOFF, EUMETSAT_GETCAPABILITIES, GEOMET_GETCAPABILITIES } from "../config/wms.config.js";
import { goesProductSchema, radarProductSchema, realtimeLayersSchema } from "../validationSchemas/wms.zod.js";
import { WMSXMLParser } from "../lib/xml-parser.js";
import { publicProcedure, router } from "../lib/trpc.js";
import { DEFAULT_REMOTE_HEADERS } from "../lib/constants.js";

export const wmsRouter = router({
  radar: publicProcedure.input(radarProductSchema).query(async ({ input }) => {
    const { product } = input;

    const dataCutoff = Date.now() - DATA_CUTOFF;

    try {
      const { parser } = new WMSXMLParser();

      const xml = await fetch(`${GEOMET_GETCAPABILITIES}&layers=${product}`, { headers: DEFAULT_REMOTE_HEADERS }).then(
        async (response) => parser.parse(await response.text()),
      );

      const layerData = xml.wmsCapabilities.capability.layer.layer.layer.layer;

      const output: WMSLayer = {
        name: layerData.name,
        dimension: layerData.dimension.value,
        domain: "national",
        type: "radar",
        timeSteps: processDimensionString(layerData.dimension.value).filter((time) => time.validTime >= dataCutoff),
      };

      return output;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  goes: publicProcedure.input(goesProductSchema).query(async ({ input }) => {
    const { domain, product } = input;

    const domainString = domain === "east" ? "GOES-East" : "GOES-West";

    const dataCutoff = Date.now() - DATA_CUTOFF;

    try {
      const { parser } = new WMSXMLParser();

      const xml = await fetch(`${GEOMET_GETCAPABILITIES}&layers=${domainString}_${product}`, {
        headers: DEFAULT_REMOTE_HEADERS,
      }).then(async (response) => parser.parse(await response.text()));

      const layerData = xml.wmsCapabilities.capability.layer.layer.layer.layer.layer;

      const output: WMSLayer = {
        name: layerData.name,
        dimension: layerData.dimension.value,
        domain: domain,
        type: "satellite",
        timeSteps: processDimensionString(layerData.dimension.value).filter((time) => time.validTime >= dataCutoff),
      };

      return output;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  eumetsat: publicProcedure.input(realtimeLayersSchema).query(async ({ input }) => {
    const { layer } = input;

    try {
      const { parser } = new WMSXMLParser();

      const xml = await fetch(EUMETSAT_GETCAPABILITIES, { headers: DEFAULT_REMOTE_HEADERS }).then(async (response) =>
        parser.parse(await response.text()),
      );

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

      const foundLayer = allLayers.find((l) => l.name === layer);

      if (!foundLayer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Layer ${layer} not found`,
        });
      }

      return {
        ...foundLayer,
        timeSteps: processDimensionString(foundLayer.dimension).filter((time) => time.validTime >= dataCutoff),
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
});
