import { FeatureCollection } from "geojson";

export interface LightningFC extends FeatureCollection {
  timeStamp: string;
  dateFrom: string;
  dateTo: string;
  totalBeforeCluster: number;
}
