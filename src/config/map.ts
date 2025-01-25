// define which satellites we have access to
export const SATELLITES = ["GOES-East", "GOES-West"] as const;
export type SatelliteList = (typeof SATELLITES)[number];

// available satellite products
export const SATELLITE_CHANNELS = {
  dayNightMicro: {
    menuName: "Day/Night Microphysics",
    wms: "1km_DayCloudType-NightMicrophysics",
  },
  irSandwich: {
    menuName: "IR Sandwich",
    wms: "1km_VisibleIRSandwich-NightMicrophysicsIR",
  },
  dayNightVisIr: {
    menuName: "Day Vis/Night IR",
    wms: "1km_DayVis-NightIR",
  },
  fireTemp: {
    menuName: "SW IR Fire Temperature",
    wms: "1km_FireTemperature-SWIR",
  },
  snowFogNightMicro: {
    menuName: "Snow and Fog/Night Microphysics",
    wms: "1km_SnowFog-NightMicrophysics",
  },
  ash: { menuName: "Volcanic Ash", wms: "2km_Ash" },
  nightIr: { menuName: "Night IR", wms: "2km_NightIR" },
} as const;

// helper types for satellite
export type SatelliteChannelsList = keyof typeof SATELLITE_CHANNELS;
export type SatelliteChannelsWMSName = (typeof SATELLITE_CHANNELS)[keyof typeof SATELLITE_CHANNELS]["wms"];
export type SatelliteChannelsMenuName = (typeof SATELLITE_CHANNELS)[keyof typeof SATELLITE_CHANNELS]["menuName"];

// define our radar products
export const RADAR_PRODUCTS = {
  rain: {
    menuName: "1KM Rain CAPPI",
    wms: "RADAR_1KM_RRAI",
  },
  snow: {
    menuName: "1KM Snow CAPPI",
    wms: "RADAR_1KM_RSNO",
  },
} as const;
// helper types for radar
export type RadarProducts = typeof RADAR_PRODUCTS;
export type RadarProductsWMSName = RadarProducts[keyof RadarProducts]["wms"];
export type RadarProductsMenuName = RadarProducts[keyof RadarProducts]["menuName"];
