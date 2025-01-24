// the shape of the data that defines the properties of each "member" of each product
type SingleAviationProduct = {
  domain: ProductDomains;
  shortName: string;
  longName: string;
  timeDelta?: number;
  timeSteps?: number;
  subProducts?: string[];
};

// build a type definition based on our full product configuration
type AviationProducts = typeof AVIATION_PRODUCTS;

// contains a list of all of the products in our configuration defined below
export type Products = keyof AviationProducts;

// helper 'type function' to extract all of the domains from the full product list without needing to manually extract the domains in an intermediate step
type ExtractDomains<T extends Products> = AviationProducts[T][number];

// export all of the product domains using our 'type function' from above
export type ProductDomains = ExtractDomains<Products>["domain"];

// the main export type that defines our fully-inferred data shape
export type AviationProductList = {
  [K in Products]: SingleAviationProduct[];
};

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
      longName: "LGFZVR41 South Coast",
      timeDelta: 3,
      timeSteps: 3,
    },
    {
      domain: "lgfzvr42",
      shortName: "LGF 42",
      longName: "LGFZVR42 Central Coast",
      timeDelta: 3,
      timeSteps: 3,
    },
    {
      domain: "lgfzvr43",
      shortName: "LGF 43",
      longName: "LGFZVR43 North Coast",
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
} as const;
