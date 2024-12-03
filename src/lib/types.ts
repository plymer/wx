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

export type View = { lon: number; lat: number; zoom: number };

export type DataParams = {
  timeStart: number;
  timeEnd: number;
  timeSlices: number;
  timeDiff: number;
  urls: string[];
};

export type LayerDetails = {
  name: string;
  type: string;
  domain: "west" | "east" | undefined;
  product: string | undefined;
  position: number;
};
