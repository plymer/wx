export const PUBLIC_FORECAST_CONFIG = {
  pspc: {
    longName: "Pacfic Storm Prediction Centre",
    shortName: "PSPC",
    city: "Vancouver",
    products: {},
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
    longName: "Prairie and Arctic Storm Prediction Centre",
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
    products: {},
  },
  aspc: {
    longName: "Atlantic Storm Prediction Centre",
    shortName: "ASPC",
    city: "Halifax",
    products: {},
  },
  nlwo: {
    longName: "Newfoundland and Labrador Weather Office",
    shortName: "NLWO",
    city: "Gander",
    products: {},
  },
} as const;
