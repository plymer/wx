import type { FeatureCollection } from "geojson";

export interface LightningFC extends FeatureCollection {
  timeStamp: string;
  dateFrom: string;
  dateTo: string;
  totalBeforeCluster: number;
}

// TODO this type isn't correctly defined but it somehow works -- will need to revist this during convective season to properly create a type like FeatureCollection<Geometry, LightningProperties> or something like that
