// custom type definitions

export type AnimationState = "playing" | "loading" | "paused" | "stopped";

export type APIResponse = {
  status: "error" | "success";
};

export type SiteData = APIResponse & {
  metadata: {
    icaoId: string;
    location: string;
    lat: string;
    lon: string;
    elev_f: string;
    elev_m: string;
    sunrise: string;
    sunset: string;
  };
};

export type TAFData = APIResponse & {
  taf: {
    main: string;
    partPeriods: string[];
    rmk: string;
  };
};

export type METAR = APIResponse & {
  metars: string[];
};

export type GFAData = APIResponse & {
  domain: string;
  cldwx: string[];
  turbc: string[];
};

export type OtherChartData = APIResponse & {
  domain: string;
  images: string[];
};

export type HubData = APIResponse & {
  hubData: {
    siteName: string;
    header: string;
    discussion: string;
    outlook: string;
    forecaster: string;
    office: string;
  };
};

export type GeoMetData = APIResponse & {
  timeStep: number;
  timesAvailable: number[];
  layers: LayerData[];
};

export type LayerData = {
  name: string;
  domain: "national" | "west" | "east";
  type: string;
  timeSteps: string[];
};

export type MapLayerConfig = {
  vector: string[] | "east" | "west" | "national";
  raster: string[];
};

// used to define the vector data (TODO: rename)
export type VectorDataOption = {
  name: string;
  state: boolean;
  toggle: () => void;
};

export type GeoJSON = {
  features: {
    geometry: {
      coordinates: [number, number] | [number, number][];
      type: "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon";
    };
    properties: Object;
    type: "Feature";
  }[];
  type: "FeatureCollection";
};
