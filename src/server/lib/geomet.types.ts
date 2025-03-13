export type LayerProperties = {
  name: string;
  dimension: string;
  type: string;
  domain: string;
  timeSteps: { validTime: number }[];
};
