import { InferSelectModel } from "drizzle-orm";
import { stations } from "../db/tables/stations.drizzle";

export type AQObservation = {
  sensor_index: string;
  monitor: string;
  network: string;
  lat: string;
  lng: string;
  date: string;
  prov_terr: string;
  pm25_recent_r: string;
  pm25_recent: string;
  pm25_1hr_r: string;
  pm25_1hr: string;
  pm25_3hr_r: string;
  pm25_3hr: string;
  pm25_24hr_r: string;
  pm25_24hr: string;
  temperature: string;
  rh: string;
  pressure: string;
  val_24hr_r: string;
  val_1hr_r: string;
  val_r: string;
  val_24hr: string;
  val_1hr: string;
  val: string;
  icon_url_24hr_r: string;
  icon_url_1hr_r: string;
  icon_url_r: string;
  icon_url_24hr: string;
  icon_url_1hr: string;
  icon_url: string;
};

export type AQOutput = {
  name: string | null;
  type: string | null;
  lat: number | null;
  lon: number | null;
  validTime: Date | null;
  pm25: number | null;
};

export type CacheStationData = {
  icaoId: string;
  iataId: string;
  faaId: string;
  wmoId: string;
  lat: number;
  lon: number;
  elev: number;
  site: string;
  state: string;
  country: string;
  priority: number;
};

export type StationData = InferSelectModel<typeof stations>;
