import type { GFAData } from "@/lib/types";

// this is the full list of all of our products available to us
export const AVIATION_PRODUCTS = {
  gfa: [
    {
      domain: "gfacn31",
      shortName: "GFA 31",
      longName: "GFACN31 Pacific Region",
      timeDelta: 6,
      timeSteps: 3,
      subProducts: ["CLDWX", "TURBC"],
    },
    {
      domain: "gfacn32",
      shortName: "GFA 32",
      longName: "GFACN32 Prairies Region",
      timeDelta: 6,
      timeSteps: 3,
      subProducts: ["CLDWX", "TURBC"],
    },
    {
      domain: "gfacn33",
      shortName: "GFA 33",
      longName: "GFACN33 Ontario-Quebec Region",
      timeDelta: 6,
      timeSteps: 3,
      subProducts: ["CLDWX", "TURBC"],
    },
    {
      domain: "gfacn34",
      shortName: "GFA 34",
      longName: "GFACN34 Atlantic Region",
      timeDelta: 6,
      timeSteps: 3,
      subProducts: ["CLDWX", "TURBC"],
    },
    {
      domain: "gfacn35",
      shortName: "GFA 35",
      longName: "GFACN35 Yukon-NWT Region",
      timeDelta: 6,
      timeSteps: 3,
      subProducts: ["CLDWX", "TURBC"],
    },
    {
      domain: "gfacn36",
      shortName: "GFA 36",
      longName: "GFACN36 Nunavut Region",
      timeDelta: 6,
      timeSteps: 3,
      subProducts: ["CLDWX", "TURBC"],
    },
    {
      domain: "gfacn37",
      shortName: "GFA 37",
      longName: "GFACN37 Arctic Region",
      timeDelta: 6,
      timeSteps: 3,
      subProducts: ["CLDWX", "TURBC"],
    },
  ],
  lgf: [
    {
      domain: "lgfzvr41",
      shortName: "LGF 41",
      longName: "South Coast LGF",
      timeDelta: 3,
      timeSteps: 3,
    },
    {
      domain: "lgfzvr42",
      shortName: "LGF 42",
      longName: "Central Coast LGF",
      timeDelta: 3,
      timeSteps: 3,
    },
    {
      domain: "lgfzvr43",
      shortName: "LGF 43",
      longName: "North Coast LGF",
      timeDelta: 3,
      timeSteps: 3,
    },
  ],
  hlt: [
    {
      domain: "canada",
      shortName: "CanHLT",
      longName: "Canadian HLT",
      timeDelta: 12,
      timeSteps: 2,
    },
    {
      domain: "north_atlantic",
      shortName: "NAHLT",
      longName: "North Atlantic HLT",
      timeDelta: 12,
      timeSteps: 2,
    },
  ],
  sigwx: [
    {
      domain: "canada",
      shortName: "CanSigWx",
      longName: "Canadian Significant Weather",
      timeDelta: 6,
      timeSteps: 4,
    },
    {
      domain: "atlantic",
      shortName: "NASigWx",
      longName: "North Atlantic Significant Weather",
      timeDelta: 12,
      timeSteps: 2,
    },
  ],
  hubs: [],
} as const;

export const PRODUCTS = Object.keys(AVIATION_PRODUCTS) as Array<keyof typeof AVIATION_PRODUCTS>;

const dummyArray = ["a", "b", "c"];

export const GFA_PLACEHOLDER_DATA: GFAData[] = [
  { domain: "gfacn31", cldwx: dummyArray, turbc: dummyArray },
  { domain: "gfacn32", cldwx: dummyArray, turbc: dummyArray },
  { domain: "gfacn33", cldwx: dummyArray, turbc: dummyArray },
  { domain: "gfacn34", cldwx: dummyArray, turbc: dummyArray },
  { domain: "gfacn35", cldwx: dummyArray, turbc: dummyArray },
  { domain: "gfacn36", cldwx: dummyArray, turbc: dummyArray },
  { domain: "gfacn37", cldwx: dummyArray, turbc: dummyArray },
];
