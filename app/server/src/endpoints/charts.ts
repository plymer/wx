import { TRPCError } from "@trpc/server";

import type { NavCanImageList, NavCanResponse } from "../lib/alphanumeric.types.js";
import { publicProcedure, router } from "../lib/trpc.js";
import type { GFAData, OtherChartData, OutlookData, Panel, RegionData } from "../lib/types.js";
import path from "path";
import { OUTLOOK_NAV_DIR, OUTLOOK_ROOT_DIR } from "../config/charts.config.js";
import { existsSync, readdirSync, stat, statSync } from "fs";
import { OFFICE_REGION_MAP } from "../config/charts.config.js";
import { outlookHandler } from "../lib/utils.js";

export const chartsRouter = router({
  gfa: publicProcedure.query(async (): Promise<GFAData[]> => {
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
        if (Object.hasOwn(results, gfa.geography.toLowerCase())) {
          Object.assign(results[gfa.geography.toLowerCase()], {
            [gfa.sub_product.toLowerCase()]: gfa.frame_lists[2].frames.map(
              (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image",
            ),
          });
        } else {
          Object.assign(results, {
            [gfa.geography.toLowerCase()]: {
              [gfa.sub_product.toLowerCase()]: gfa.frame_lists[2].frames.map(
                (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image",
              ),
            },
          });
        }
      });

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

  swo: publicProcedure.query(async (): Promise<OutlookData | null> => {
    try {
      const result = outlookHandler("swo");
      return result as OutlookData;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
  tso: publicProcedure.query(async (): Promise<OutlookData | null> => {
    try {
      const result = outlookHandler("tso");
      return result as OutlookData;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  sigwx: publicProcedure.query(async (): Promise<OtherChartData[]> => {
    try {
      const url = "https://plan.navcanada.ca/weather/api/alpha/?site=CYHZ&image=SIG_WX//MID_LEVEL/*";

      console.log("[API] Requesting SigWx charts from:", url);

      const ncAPIData: NavCanResponse = await fetch(url)
        .then((gfas) => gfas.json())
        .then((data) => data as NavCanResponse);
      const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

      const results: Record<string, string[]> = {};

      rawList.forEach((p) => {
        const product = p.product.toLowerCase();

        if (Object.hasOwn(results, product)) {
          Object.assign(results[product], {
            [p.sub_geography.toLowerCase()]: p.frame_lists[0].frames.map(
              (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image",
            ),
          });
        } else {
          Object.assign(results, {
            [product]: {
              [p.sub_geography.toLowerCase()]: p.frame_lists[0].frames.map(
                (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image",
              ),
            },
          });
        }
      });

      return Object.entries(results["sig_wx"]).reduce((acc: { domain: string; images: string[] }[], [key, val]) => {
        acc.push({ domain: key, images: val as unknown as string[] });
        return acc;
      }, []);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  hlt: publicProcedure.query(async (): Promise<OtherChartData[]> => {
    try {
      const url = "https://plan.navcanada.ca/weather/api/alpha/?site=CYHZ&image=TURBULENCE";

      console.log("[API] Requesting HLT charts from:", url);

      const ncAPIData: NavCanResponse = await fetch(url)
        .then((gfas) => gfas.json())
        .then((data) => data as NavCanResponse);
      const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

      const results: Record<string, string[]> = {};
      rawList.forEach((p) => {
        const product = p.product.toLowerCase();

        if (Object.hasOwn(results, product)) {
          Object.assign(results[product], {
            [p.geography.toLowerCase()]: p.frame_lists[0].frames.map(
              (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image",
            ),
          });
        } else {
          Object.assign(results, {
            [product]: {
              [p.geography.toLowerCase()]: p.frame_lists[0].frames.map(
                (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image",
              ),
            },
          });
        }
      });

      return Object.entries(results["turbulence"]).reduce((acc: { domain: string; images: string[] }[], [key, val]) => {
        acc.push({ domain: key, images: val as unknown as string[] });
        return acc;
      }, []);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  lgf: publicProcedure.query(async (): Promise<OtherChartData[]> => {
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
            (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image",
          ),
        });
      });

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
});
