export type SiteData = {
  icaoId: string;
  location: string;
  lat: string;
  lon: string;
  elev_f: string;
  elev_m: string;
  sunrise: string;
  sunset: string;
};

export type TAFData = {
  main: string;
  partPeriods: string[];
  rmk: string;
};
