export const APP_MODES_LIST = {
  pub: { longName: "Public", shortName: "PUB" },
  avn: { longName: "Aviation", shortName: "AVN" },
  obs: { longName: "Observations", shortName: "OBS" },
  map: { longName: "Weather Map", shortName: "MAP" },
  otlk: { longName: "Outlook", shortName: "OTLK" },
};

export type AppMode = keyof typeof APP_MODES_LIST;
