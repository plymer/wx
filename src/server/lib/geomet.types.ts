export type GeoMetLayer = {
  name: string;
  dimension: string;
  domain: string;
  type: "radar" | "satellite";
  timeSteps?: { validTime: number }[];
};
