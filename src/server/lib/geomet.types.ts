export const GEOMET_MODES = ["loop", "current"] as const;

export type GeoMetModes = (typeof GEOMET_MODES)[number];

export type GeoMetLayer = {
  layers: string;
  mode: GeoMetModes;
  frames: number;
};

export type LayerProperties = {
  name: string | null;
  dimension?: string | null;
  type: string;
  domain: string;
  // storing all times as UTC date-time strings
  deltaTime?: number;
  startTime?: string;
  endTime?: string;
  timeSteps?: string[];
};

export type TempLayer = Omit<LayerProperties, "Dimension"> & {
  start?: number;
  startString?: string;
  end?: number;
  endString?: string;
  delta?: number;
  deltaString?: string;
  duration?: number;
};
