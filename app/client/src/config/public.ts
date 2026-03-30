export const PUBLIC_FORECAST_CONFIG = {
  pspc: {
    longName: "Pacfic Storm Prediction Centre",
    shortName: "PSPC",
    city: "Vancouver",
    products: {
      fpcn11cwvr: "South Coast",
      fpcn12cwvr: "Central and North Coast",
      fpcn13cwvr: "Southwest Interior",
      fpcn14cwvr: "Columbia Districts",
      fpcn15cwvr: "Kootenay Districts",
      fpcn16cwvr: "Central Interior",
      fpcn17cwvr: "SE Yukon & Northern BC",
      fpcn18cwvr: "Northeast BC",
      fpcn19cwvr: "N/Central/SW Yukon & NW BC",
    },
  },
  paspcedm: {
    longName: "Prairie and Arctic Storm Prediction Centre",
    shortName: "PASPC-Edm",
    city: "Edmonton",
    products: {
      focn45cwwg: "Significant Weather Discussion",
      fpcn15cwwg: "Southern AB",
      fpcn16cwwg: "Northern AB",
      fpcn14cwwg: "Northern SK",
      fpcn11cwnt: "Southern NWT",
      fpcn12cwnt: "Northern NWT",
      fpcn14cwnt: "Western NU",
      fpcn15cwnt: "Northern NU",
    },
  },
  paspcwpg: {
    longName: "Winnipeg Storm Prediction Centre",
    shortName: "PASPC-Wpg",
    city: "Winnipeg",
    products: {
      focn45cwwg: "Significant Weather Discussion",
      fpcn11cwwg: "Southern MB",
      fpcn12cwwg: "Northern MB",
      fpcn13cwwg: "Southern SK",
      fpcn13cwnt: "Southern NU",
      fpcn16cwnt: "Eastern NU",
    },
  },
  ospc: {
    longName: "Ontario Storm Prediction Centre",
    shortName: "OSPC",
    city: "Toronto",
    products: {
      fpcn11cwto: "Southern ON",
      fpcn12cwto: "Northern ON",
      fpcn13cwto: "Far Northern ON",
    },
  },
  qspc: {
    longName: "Quebec Storm Prediction Centre",
    shortName: "QSPC",
    city: "Montreal",
    products: {
      fpcn11cwul: "Western QC",
      fpcn12cwqb: "Northern QC",
      fpcn13cwqb: "Central QC",
      fpcn14cwxk: "Eastern QC",
    },
  },
  aspc: {
    longName: "Atlantic Storm Prediction Centre",
    shortName: "ASPC",
    city: "Halifax",
    products: {
      fpcn11cwhx: "Nova Scotia",
      fpcn13chwx: "Iles de la Madeleine",
      fpcn14cwhx: "New Brunswick",
      fpcn15cwhx: "Prince Edward Island",
    },
  },
  nlwo: {
    longName: "Newfoundland and Labrador Weather Office",
    shortName: "NLWO",
    city: "Gander",
    products: {
      fpcn16cwhx: "Newfoundland",
      fpcn17cwhx: "Labrador",
    },
  },
} as const;

export const OUTLOOK_CONFIG = {
  pspc: { id: "PSPC", name: "Pacific Storm Prediction Centre" },
  paspc: { id: "PASPC", name: "Prairie and Arctic Storm Prediction Centre" },
  ospc: { id: "OSPC", name: "Ontario Storm Prediction Centre" },
  qspc: { id: "QSPC", name: "Quebec Storm Prediction Centre" },
  aspc: { id: "ASPC", name: "Atlantic Storm Prediction Centre" },
  nlwo: { id: "NLWO", name: "Newfoundland and Labrador Weather Office" },
} as const;
