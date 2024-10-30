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

export type APIResponse = {
  status: "error" | "success";
};

export type GFAData = {
  domain: string;
  cldwx: string[];
  turbc: string[];
};

export type OtherChartData = {
  domain: string;
  images: string[];
};
