import type { FeatureCollection, LineString, Point, Polygon } from "geojson";
import type { Prettify } from "./types.js";

export type BaseProperties = {
  amendment: number;
  storm_origin_year: number;
  publication_datetime: Date;
  forecast_datetime: Date;
  product_sub_type: string;
  product_class: string;
  id: string;
  validity_datetime: Date;
  basin: string;
  product_type: string;
  storm_name: string;
  domain: string;
  storm_number: number;
  responsible_center: string;
  status: string;
  file_name: string;
  active: boolean;
  latest_publication: boolean;
};

export type ValueWithUnit = {
  value: number;
  unit: string;
};

export type IncomingCycloneProperties = Prettify<
  BaseProperties & {
    type: "cyclone";
    "metobject.classification": string;
    "metobject.max_wind.value": number;
    "metobject.max_wind.unit": "kt";
    "metobject.motion.direction": { value: number; unit: "deg" };
    "metobject.motion.intensity": { value: number; unit: "kt" };
    "metobject.pressure.value": number;
    "metobject.pressure.unit": "mbar";
    "metobject.sub_type": string | undefined;
    "metobject.wind_gust.value": number;
    "metobject.wind_gust.unit": "kt";
  }
>;

export type CycloneProperties = Prettify<
  BaseProperties & {
    type: "cyclone";
    metobject: {
      classification: string;
      max_wind: ValueWithUnit;
      motion: {
        direction: ValueWithUnit;
        intensity: ValueWithUnit;
      };
      pressure: ValueWithUnit;
      sub_type: string | undefined;
      wind_gust: ValueWithUnit;
    };
  }
>;

export type IncomingWindRadiiProperties = Prettify<
  BaseProperties & {
    type: "wind_radii";
    "metobject.cyclone": string;
    "metobject.quadrants.n_e": {
      distance: ValueWithUnit;
    };
    "metobject.quadrants.n_w": {
      distance: ValueWithUnit;
    };
    "metobject.quadrants.s_e": {
      distance: ValueWithUnit;
    };
    "metobject.quadrants.s_w": {
      distance: ValueWithUnit;
    };
  }
>;

export type WindRadiiProperties = Prettify<
  BaseProperties & {
    type: "wind_radii";
    metobject: {
      cyclone: string;
      quadrants: {
        n_e: {
          distance: ValueWithUnit;
        };
        n_w: {
          distance: ValueWithUnit;
        };
        s_e: {
          distance: ValueWithUnit;
        };
        s_w: {
          distance: ValueWithUnit;
        };
      };
    };
  }
>;

export type IncomingErrorConeProperties = Prettify<
  BaseProperties & {
    type: "error_cone";
    "metobject.cyclone_0.along_track_error": ValueWithUnit;
    "metobject.cyclone_0.cross_track_error": ValueWithUnit;
    "metobject.cyclone_1.along_track_error": ValueWithUnit;
    "metobject.cyclone_1.cross_track_error": ValueWithUnit;
    "metobject.cyclone_2.along_track_error": ValueWithUnit;
    "metobject.cyclone_2.cross_track_error": ValueWithUnit;
  }
>;

export type ErrorConeProperties = Prettify<
  BaseProperties & {
    type: "error_cone";
    metobject: {
      cyclone_0: {
        along_track_error: ValueWithUnit;
        cross_track_error: ValueWithUnit;
      };
      cyclone_1: {
        along_track_error: ValueWithUnit;
        cross_track_error: ValueWithUnit;
      };
      cyclone_2: {
        along_track_error: ValueWithUnit;
        cross_track_error: ValueWithUnit;
      };
    };
  }
>;

export type IncomingTrackProperties = Prettify<
  BaseProperties & {
    type: "track";
  }
>;

export type TrackProperties = Prettify<
  BaseProperties & {
    type: "track";
  }
>;

export type HurricaneDataType = "track" | "error_cone" | "cyclone" | "wind_radii";

export type HurricaneDataResponse = {
  track: FeatureCollection<LineString, IncomingTrackProperties>;
  error_cone: FeatureCollection<Polygon, IncomingErrorConeProperties>;
  cyclone: FeatureCollection<Point, IncomingCycloneProperties>;
  wind_radii: FeatureCollection<Polygon, IncomingWindRadiiProperties>;
};

export type HurricaneData = {
  track: FeatureCollection<LineString, TrackProperties>;
  error_cone: FeatureCollection<Polygon, ErrorConeProperties>;
  cyclone: FeatureCollection<Point, CycloneProperties>;
  wind_radii: FeatureCollection<Polygon, WindRadiiProperties>;
};
