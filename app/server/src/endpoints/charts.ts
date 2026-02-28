import { TRPCError } from "@trpc/server";

import { publicProcedure, router } from "../lib/trpc.js";
import type { NavCanImageList, NavCanResponse } from "../lib/alphanumeric.types.js";
import type { GFAData, OtherChartData, OutlookData } from "../lib/types.js";

import { outlookHandler } from "../lib/utils.js";
import { NAVCAN_IMAGE_URL } from "../config/charts.config.js";

export const chartsRouter = router({
  gfa: publicProcedure.query(async (): Promise<GFAData[] | undefined> => {
    try {
      const url =
        "https://plan.navcanada.ca/weather/api/alpha/?site=CYEG&site=CYVR&site=CYZF&site=CYFB&site=CYYZ&site=CYHZ&site=CYRB&image=GFA/CLDWX&image=GFA/TURBC";

      console.log("[API] Requesting GFAs from:", url);

      const ncAPIData: NavCanResponse = await fetch(url)
        .then((gfas) => gfas.json())
        .then((data) => data as NavCanResponse);
      const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

      const results: Record<string, { cldwx: string[]; turbc: string[] }> = {};
      rawList.forEach((gfa) => {
        const geography = gfa.geography.toLowerCase();
        const imageFrames = gfa.frame_lists[2].frames;
        const subProduct = gfa.sub_product.toLowerCase();

        if (Object.hasOwn(results, geography)) {
          Object.assign(results[geography], {
            [subProduct]: imageFrames.map((f) => `${NAVCAN_IMAGE_URL}${f.images[f.images.length - 1].id}.image}`),
          });
        } else {
          Object.assign(results, {
            [gfa.geography.toLowerCase()]: {
              [subProduct]: imageFrames.map((f) => `${NAVCAN_IMAGE_URL}${f.images[f.images.length - 1].id}.image}`),
            },
          });
        }
      });

      if (!Object.keys(results).length || Object.keys(results).length === 0) return undefined;

      return Object.keys(results).map((d) => {
        return { domain: d, cldwx: results[d].cldwx, turbc: results[d].turbc };
      });
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  sigwx: publicProcedure.query(async (): Promise<OtherChartData[] | undefined> => {
    try {
      const url = "https://plan.navcanada.ca/weather/api/alpha/?site=CYHZ&image=SIG_WX//MID_LEVEL/*";

      console.log("[API] Requesting SigWx charts from:", url);

      const ncAPIData: NavCanResponse = await fetch(url)
        .then((gfas) => gfas.json())
        .then((data) => data as NavCanResponse);
      const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

      const results: Record<string, string[]> = {};

      rawList.forEach((p) => {
        const sub_geography = p.sub_geography.toLowerCase();
        const imageFrames = p.frame_lists[0].frames;

        if (Object.hasOwn(results, sub_geography)) {
          Object.assign(results[sub_geography], {
            [p.sub_geography.toLowerCase()]: imageFrames.map(
              (f) => `${NAVCAN_IMAGE_URL}${f.images[f.images.length - 1].id}.image}`,
            ),
          });
        } else {
          Object.assign(results, {
            [sub_geography]: imageFrames.map((f) => `${NAVCAN_IMAGE_URL}${f.images[f.images.length - 1].id}.image}`),
          });
        }
      });

      if (!Object.keys(results).length || Object.keys(results).length === 0) return undefined;

      return Object.entries(results).reduce((acc: { domain: string; images: string[] }[], [domain, images]) => {
        acc.push({ domain, images });
        return acc;
      }, []);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  hlt: publicProcedure.query(async (): Promise<OtherChartData[] | undefined> => {
    try {
      const url = "https://plan.navcanada.ca/weather/api/alpha/?site=CYHZ&image=TURBULENCE";

      console.log("[API] Requesting HLT charts from:", url);

      const ncAPIData: NavCanResponse = await fetch(url)
        .then((gfas) => gfas.json())
        .then((data) => data as NavCanResponse);
      const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

      const results: Record<string, string[]> = {};
      rawList.forEach((p) => {
        const geography = p.geography.toLowerCase();
        const imageFrames = p.frame_lists[0].frames;

        if (Object.hasOwn(results, geography)) {
          Object.assign(results[geography], {
            [geography]: imageFrames.map((f) => `${NAVCAN_IMAGE_URL}${f.images[f.images.length - 1].id}.image}`),
          });
        } else {
          Object.assign(results, {
            [geography]: imageFrames.map((f) => `${NAVCAN_IMAGE_URL}${f.images[f.images.length - 1].id}.image}`),
          });
        }
      });

      if (!Object.keys(results).length || Object.keys(results).length === 0) return undefined;

      return Object.entries(results).reduce((acc: { domain: string; images: string[] }[], [domain, images]) => {
        acc.push({ domain, images });
        return acc;
      }, []);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  lgf: publicProcedure.query(async (): Promise<OtherChartData[] | undefined> => {
    try {
      const url = "https://plan.navcanada.ca/weather/api/alpha/?site=CZVR&image=LGF";

      console.log("[API] Requesting LGFs from:", url);

      const ncAPIData: NavCanResponse = await fetch(url)
        .then((lgfs) => lgfs.json())
        .then((data) => data as NavCanResponse);
      const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

      const results: Record<string, string[]> = {};
      rawList.forEach((lgf) => {
        Object.assign(results, {
          [lgf.geography.toLowerCase()]: lgf.frame_lists[lgf.frame_lists.length - 1].frames.map(
            (f) => `${NAVCAN_IMAGE_URL}${f.images[f.images.length - 1].id}.image}`,
          ),
        });
      });

      if (!Object.keys(results).length || Object.keys(results).length === 0) return undefined;

      return Object.keys(results).map((p) => {
        return { domain: p, images: results[p] };
      });
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  navcan: publicProcedure.query(async () => {
    try {
      const RESOURCE_URL = "https://plan.navcanada.ca/weather/images/";

      const apiURL =
        "https://plan.navcanada.ca/weather/api/alpha/?site=CZVR&site=CZEG&site=CZWG&site=CZYZ&site=CZUL&site=CZQM&site=CZQX&image=GFA/CLDWX&image=GFA/TURBC&image=LGF&image=TURBULENCE&image=SIG_WX//MID_LEVEL/*";

      const ncAPIData: NavCanResponse = await fetch(apiURL)
        .then((imageList) => imageList.json())
        .then((data) => data as NavCanResponse);
      const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

      type NavCanOutput = Record<
        string,
        | {
            cldwx?: string[];
            turbc?: string[];
          }
        | string[]
      >;

      const output: NavCanOutput = {};

      rawList.forEach((item) => {
        switch (item.product) {
          case "GFA":
            if (Object.keys(output).includes(item.geography)) {
              Object.assign(output[item.geography], {
                [item.sub_product]: item.frame_lists[2].frames.map(
                  (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`,
                ),
              });
            } else {
              Object.assign(output, {
                [item.geography]: {
                  [item.sub_product]: item.frame_lists[2].frames.map(
                    (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`,
                  ),
                },
              });
            }
            break;
          case "SIG_WX":
            if (Object.keys(output).includes("SIGWX")) {
              Object.assign(output["SIGWX"], {
                [item.sub_geography]: item.frame_lists[0].frames.map(
                  (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`,
                ),
              });
            } else {
              Object.assign(output, {
                ["SIGWX"]: {
                  [item.sub_geography]: item.frame_lists[0].frames.map(
                    (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`,
                  ),
                },
              });
            }
            break;
          case "TURBULENCE":
            if (Object.keys(output).includes("HLT")) {
              Object.assign(output["HLT"], {
                [item.geography]: item.frame_lists[0].frames.map(
                  (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`,
                ),
              });
            } else {
              Object.assign(output, {
                ["HLT"]: {
                  [item.geography]: item.frame_lists[0].frames.map(
                    (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`,
                  ),
                },
              });
            }
            break;
          case "LGF":
            Object.assign(output, {
              [item.geography]: item.frame_lists[0].frames.map(
                (f) => `${RESOURCE_URL}${f.images[f.images.length - 1].id}.image`,
              ),
            });
            break;
        }
      });

      return output;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
  swo: publicProcedure.query(async (): Promise<OutlookData | null> => {
    try {
      return outlookHandler("swo");
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
  tso: publicProcedure.query(async (): Promise<OutlookData | null> => {
    try {
      return outlookHandler("tso");
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
});
