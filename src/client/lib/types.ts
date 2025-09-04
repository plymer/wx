// custom type definitions

import { ANIM_CONTROLS, ANIMATION_STATES } from "../config/animation";
import { API_CONFIG } from "../config/api";
import { AVIATION_PRODUCTS } from "../config/aviationProducts";
import {
  LAYER_TABS,
  MAP_LINES,
  MAP_OPTIONS_TABS,
  MAP_PROJECTIONS,
  RADAR_PRODUCTS,
  SATELLITE_CHANNELS,
  SATELLITES,
  ZOOM_THRESHOLDS,
} from "../config/map";
import { APP_MODES_LIST } from "../config/modes";
import { PUBLIC_FORECAST_CONFIG } from "../config/public";
import { RASTER_DATA_TYPES } from "../config/rasterData";
import { VECTOR_DATA_TYPES, XMET_TYPES } from "../config/vectorData";

import { FeatureCollection, MultiPoint, MultiPolygon } from "geojson";

import { InferSelectModel } from "drizzle-orm";

import { aqData } from "../../shared/db/tables/aq.drizzle.js";

import { StationData } from "../../shared/lib/types.js";
import { LngLat, MapGeoJSONFeature } from "maplibre-gl";

export type AppMode = keyof typeof APP_MODES_LIST;
export type AnimationState = (typeof ANIMATION_STATES)[number];
export type AnimationControlsList = (typeof ANIM_CONTROLS)[number];

// general helper types
export type Nullable<T> = T | null;
export type HexColor = `#${string}`;

/**
 * Prettify is a utility type that makes an object type more readable by removing excess nesting.
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};
/**
 * IIMT (Immediately Indexed Mapped Type) is a utility type that creates a mapped type where each key is immediately indexed.
 * T is the type of the object to be indexed, and D is a string that will be used as a key in the resulting type.
 *
 * (ref: https://youtu.be/lraHlXpuhKs?si=LqZmyhNY0jlBoVha&t=723)
 */
export type IIMT<T, D extends string> = {
  [K in keyof T]: Prettify<{ [P in D]: K } & T[K]>;
}[keyof T];

// helper types for API configuration
export type EndpointParams = keyof (typeof API_CONFIG)["endpoints"][number];
export type EndpointUrls = (typeof API_CONFIG)["endpoints"][number]["url"];

// use this to build the IIMT for API responses
type ApiReponses<TData> = {
  success: {
    data: TData;
  };
  error: {
    message: any;
  };
  noData: {};
};

// create an immediately indexed mapped type for API responses
export type APIResponse<TData> = IIMT<ApiReponses<TData>, "status">;

export type XmetTypes = (typeof XMET_TYPES)[number];

export type XmetAPIData = {
  issuer: string;
  header: string;
  domain: string;
  alphaCode?: string;
  charCode: string;
  numberCode: number;
  sequenceId: string;
  startTime: number;
  endTime: number;
  hazard: string;
  motionVector: {
    direction: number | null;
    speed: number;
  };
  text: string;
  dataType: XmetTypes;
};

export type XmetGeoJSON = FeatureCollection<MultiPolygon, XmetAPIData>;

export type SiteData = Prettify<
  StationData & {
    sunrise: string;
    sunset: string;
  }
>;

export type LightningData = FeatureCollection<MultiPoint, { validTime: number }>;
export type AqDbData = Omit<InferSelectModel<typeof aqData>, "id">;
export type AqData = FeatureCollection<MultiPoint, AqDbData>;

export type METAR = string[];
export type TAFData = string;

export type ParsedTAF = {
  main: string | undefined;
  partPeriods: string[] | undefined;
  rmk: string | undefined;
};

export type GFAData = {
  domain: string;
  cldwx: string[];
  turbc: string[];
};

export type OtherChartData = {
  domain: string;
  images: string[];
};

export type HubData = {
  siteName: string;
  header: string;
  discussion: string;
  outlook: string;
  forecaster: string;
  office: string;
};

// this replaces 'LayerData' for the raster layers
export type RasterLayerData = {
  name: string;
  domain: "national" | "west" | "east";
  type: string;
  timeSteps: { validTime: number }[];
};

export type MapLayerConfig = {
  vector: string[] | "east" | "west" | "national";
  raster: string[];
};

// used to define the vector data (TODO: rename)
export type ToggleDataOption = {
  type: VectorDataTypes | MapLines | RasterDataTypes;
  name: string;
  state: boolean;
  toggle: () => void;
};

export type GeoJSON = {
  features: GeoJSONFeature[];
  type: "FeatureCollection";
};

export type GeoJSONFeature = {
  geometry: {
    coordinates: number[] | number[][] | number[][][][];
    type: GeoJSONFeatureTypes;
  };
  properties: Record<string, any>;
  type: "Feature";
};

export type GeoJSONFeatureTypes =
  | "Point"
  | "LineString"
  | "Polygon"
  | "MultiPoint"
  | "MultiLineString"
  | "MultiPolygon";

export type OverlayOptions = {
  layout?: object;
  paint?: object;
};

export type PublicBulletin = string;

export type PublicForecastOffice = keyof typeof PUBLIC_FORECAST_CONFIG;

export type VectorDataTypes = (typeof VECTOR_DATA_TYPES)[number];

export type VectorConfig = {
  paint: object;
  type: "circle" | "fill";
};

export type VectorDisplayConfig = {
  [K in VectorDataTypes]: VectorConfig;
};

export type RasterDataTypes = (typeof RASTER_DATA_TYPES)[number];

// helper types for satellite
export type SatelliteList = (typeof SATELLITES)[number];
export type SatelliteChannelsList = keyof typeof SATELLITE_CHANNELS;
export type SatelliteChannelsWMSName = (typeof SATELLITE_CHANNELS)[keyof typeof SATELLITE_CHANNELS]["wms"];
export type SatelliteChannelsMenuName = (typeof SATELLITE_CHANNELS)[keyof typeof SATELLITE_CHANNELS]["menuName"];

export type SatelliteChannels = IIMT<typeof SATELLITE_CHANNELS, "channel">;

// helper types for radar
export type RadarProducts = typeof RADAR_PRODUCTS;
export type RadarProductsWMSName = RadarProducts[keyof RadarProducts]["wms"];
export type RadarProductsMenuName = RadarProducts[keyof RadarProducts]["menuName"];
export type MapProjections = (typeof MAP_PROJECTIONS)[number];
export type MapOptionsTabs = (typeof MAP_OPTIONS_TABS)[number];
export type LayerTabs = (typeof LAYER_TABS)[number];
export type MapLines = (typeof MAP_LINES)[number];
export type ZoomThresholds = keyof typeof ZOOM_THRESHOLDS;

// the shape of the data that defines the properties of each "member" of each product
type SingleAviationProduct = {
  domain: ProductDomains;
  shortName: string;
  longName: string;
  timeDelta?: number;
  timeSteps?: number;
  subProducts?: string[];
};

// build a type definition based on our full product configuration
type AviationProducts = typeof AVIATION_PRODUCTS;

// contains a list of all of the products in our configuration defined below
export type Products = keyof AviationProducts;

// helper 'type function' to extract all of the domains from the full product list without needing to manually extract the domains in an intermediate step
type ExtractDomains<T extends Products> = Prettify<AviationProducts[T][number]>;

// export all of the product domains using our 'type function' from above
export type ProductDomains = ExtractDomains<Products>["domain"];

// the main export type that defines our fully-inferred data shape
export type AviationProductList = {
  [K in Products]: SingleAviationProduct[];
};

export type AviationProductListM = IIMT<AviationProducts, "product">;

export type MapPopupData = {
  features: MapGeoJSONFeature[];
  lngLat: LngLat;
};
