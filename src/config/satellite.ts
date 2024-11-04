// available satellite products
export const SATELLITE_CHANNELS = [
  {
    menuName: "Day/Night Microphysics",
    wms: "1km_DayCloudType-NightMicrophysics",
  },
  { menuName: "IR Sandwich", wms: "1km_VisibleIRSandwich-NightMicrophysicsIR" },
  { menuName: "Day Vis/Night IR", wms: "1km_DayVis-NightIR" },
  { menuName: "SW IR Fire Temperature", wms: "1km_FireTemperature-SWIR" },
  {
    menuName: "Snow and Fog/Night Microphysics",
    wms: "1km_SnowFog-NightMicrophysics",
  },
  { menuName: "Volcanic Ash", wms: "2km_Ash" },
  { menuName: "Night IR", wms: "2km_NightIR" },
];
