export type SunTimes = {
  rise: string;
  set: string;
};

export type LatLon = {
  lat: number;
  lon: number;
};

export type SwrCacheEntry<T> = {
  data: T;
  freshUntil: number;
  staleUntil: number;
};
