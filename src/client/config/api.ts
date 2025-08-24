export const API_CONFIG = {
  baseUrl: "/api",
  endpoints: [
    {
      data: "metars",
      url: "/alpha/metars",
      description: "returns surface data",
      params: ["site", "hrs"],
    },
    {
      data: "taf",
      url: "/alpha/taf",
      description: "returns surface data",
      params: ["site"],
    },
    {
      data: "sitedata",
      url: "/alpha/sitedata",
      description: "returns surface data",
      params: ["site"],
    },
    {
      data: "hubs",
      url: "/alpha/hubs",
      description: "returns surface data",
      params: ["site"],
    },
    {
      data: "geomet",
      url: "/geomet",
      description: "returns a list of layers, with their valid times coordinated",
      params: ["layers", "mode", "frames"],
    },
    {
      data: "geomet",
      url: "/charts/gfa",
      description: "returns a list of layers, with their valid times coordinated",
      params: null,
    },

    {
      data: "geomet",
      url: "/charts/lgf",
      description: "returns a list of layers, with their valid times coordinated",
      params: null,
    },

    {
      data: "geomet",
      url: "/charts/hlt",
      description: "returns a list of layers, with their valid times coordinated",
      params: null,
    },

    {
      data: "geomet",
      url: "/charts/sigwx",
      description: "returns a list of layers, with their valid times coordinated",
      params: null,
    },
    {
      data: "public bulletins",
      url: "/alpha/public/bulletin",
      description: "returns the public bulletin requested",
      params: ["office", "bulletin"],
    },
    {
      data: "lightning",
      url: "/lightning",
      description: "returns lightning data for the last 3 hours",
      params: null,
    },
    { data: "aq", url: "/aq", description: "returns air quality data for the last 4 hours", params: ["hours"] },
    {
      data: "wxmap metars",
      url: "/wxmap/metars",
      description: "returns metar data for all stations on the map",
      params: null,
    },
  ],
} as const;
