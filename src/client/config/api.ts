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
      params: [],
    },

    {
      data: "geomet",
      url: "/charts/lgf",
      description: "returns a list of layers, with their valid times coordinated",
      params: [],
    },

    {
      data: "geomet",
      url: "/charts/hlt",
      description: "returns a list of layers, with their valid times coordinated",
      params: [],
    },

    {
      data: "geomet",
      url: "/charts/sigwx",
      description: "returns a list of layers, with their valid times coordinated",
      params: [],
    },
    {
      data: "public bulletins",
      url: "/alpha/public/bulletin",
      description: "returns the public bulletin requested",
      params: ["office", "bulletin"],
    },
  ],
} as const;

export type EndpointParams = keyof (typeof API_CONFIG)["endpoints"][number];

export type EndpointUrls = (typeof API_CONFIG)["endpoints"][number]["url"];
