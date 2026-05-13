import type { FeatureCollection } from "geojson";

// the WxOffice API has some non-standard datashape for its lightning GeoJSON where it has top-level properties defined which violates my understanding of known conventions in GeoJSON spec :shrug-emoji:

export interface LightningFC extends FeatureCollection {
  timeStamp: string;
  dateFrom: string;
  dateTo: string;
  totalBeforeCluster: number;
}
