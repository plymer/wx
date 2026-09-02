import { useState } from "react";

import {
  CloudLightning,
  Globe,
  Layers,
  Radar,
  Satellite,
  Map,
  List,
  FlameKindling,
  Thermometer,
  TriangleAlert,
  Droplet,
  Snowflake,
  Rss,
  X,
  CirclePlus,
  AlertTriangle,
  Plane,
  Grid3X3,
} from "lucide-react";

import { SATELLITE_CHANNELS } from "@/config/rasterData";

import {
  useRadarProduct,
  useRasterStateActions,
  useSatelliteProduct,
  useShowRadar,
  useShowSatellite,
} from "@/stateStores/map/rasterData";
import {
  useShowAIRMETs,
  useShowLightning,
  useShowObs,
  useShowPIREPs,
  useShowSIGMETs,
  useVectorActions,
  useShowAQ,
  useShowPublicAlerts,
  useShowIsobars,
  useShowIsotherms,
  useShowIsodrosotherms,
  usePublicAlertsFilterLevel,
  useShowHurricanes,
} from "@/stateStores/map/vectorData";
import type { SatelliteChannelsList, SatelliteChannelsWMSName, ToggleDataOption } from "@/lib/types";
import { useLayersTab, useUIActions } from "@/stateStores/map/ui";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import Button, { type ButtonProps } from "@/components/ui/Button";
import DataToggle from "@/components/ui/DataToggle";
import { useBaseMap, useMapStateActions, useProjection } from "@/stateStores/map/mapView";
import {
  useGFAOverlay,
  useLGFOverlay,
  useFIROverlay,
  useTAFsOverlay,
  useBedpostsOverlay,
  usePublicRegionsOverlay,
  useMarineRegionsOverlay,
  useVectorOverlayActions,
} from "@/stateStores/map/overlays";
import { BASEMAP_TYPES } from "@/config/map";

export default function MapOptions({ ...props }: ButtonProps) {
  // local state
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // global state
  const vector = {
    useShowAQ: useShowAQ(),
    showLightning: useShowLightning(),
    showObs: useShowObs(),
    showIsobars: useShowIsobars(),
    showIsotherms: useShowIsotherms(),
    showIsodrosotherms: useShowIsodrosotherms(),
    showPIREPs: useShowPIREPs(),
    showSIGMETs: useShowSIGMETs(),
    showAIRMETs: useShowAIRMETs(),
    showPublicAlerts: useShowPublicAlerts(),
    showHurricanes: useShowHurricanes(),
    alertsFilterLevel: usePublicAlertsFilterLevel(),
  };

  const raster = {
    showSatellite: useShowSatellite(),
    showRadar: useShowRadar(),
    satelliteProduct: useSatelliteProduct(),
    radarProduct: useRadarProduct(),
  };

  const overlays = {
    showGFA: useGFAOverlay(),
    showLGF: useLGFOverlay(),
    showFIR: useFIROverlay(),
    showTAFs: useTAFsOverlay(),
    showBedposts: useBedpostsOverlay(),
    showPublicRegions: usePublicRegionsOverlay(),
    showMarineRegions: useMarineRegionsOverlay(),
  };

  const map = { projection: useProjection(), basemap: useBaseMap() };

  const tab = useLayersTab();

  const overlayActions = useVectorOverlayActions();
  const rasterActions = useRasterStateActions();
  const vectorActions = useVectorActions();
  const UIActions = useUIActions();
  const mapActions = useMapStateActions();

  // vector options config
  const VECTOR_DATA_OPTIONS: ToggleDataOption[] = [
    {
      icon: <FlameKindling className="shrink-0" />,
      type: "aq",
      name: "PM 2.5μm",
      state: vector.useShowAQ,
      toggle: vectorActions.toggleAQ,
    },
    {
      icon: <CloudLightning className="shrink-0" />,
      type: "lightning",
      name: "Lightning",
      state: vector.showLightning,
      toggle: vectorActions.toggleLightning,
    },
    {
      icon: <Thermometer className="shrink-0" />,
      type: "surfaceObs",
      name: "Surface Plots",
      state: vector.showObs,
      toggle: vectorActions.toggleObs,
    },
    {
      icon: <Rss className="shrink-0" />,
      type: "isobars",
      name: "Isobars",
      state: vector.showIsobars,
      toggle: vectorActions.toggleIsobars,
    },
    {
      icon: <Rss className="shrink-0" />,
      type: "isotherms",
      name: "Isotherms",
      state: vector.showIsotherms,
      toggle: vectorActions.toggleIsotherms,
    },
    // {
    //   icon: <Rss className="shrink-0" />,
    //   type: "isodrosotherms",
    //   name: "TD",
    //   state: vector.showIsodrosotherms,
    //   toggle: vectorActions.toggleIsodrosotherms,
    // },
    // {
    //   type: "pirep",
    //   name: "PIREPs",
    //   state: vector.showPIREPs,
    //   toggle: vectorActions.togglePIREPs,
    // },
  ] as const;

  const SIGWX_DATA_OPTIONS: ToggleDataOption[] = [
    {
      icon: <Plane className="shrink-0" />,
      type: "hurricanes",
      name: "Hurricanes",
      state: vector.showHurricanes,
      toggle: vectorActions.toggleHurricanes,
    },
    {
      icon: <Plane className="shrink-0" />,
      type: "sigmet",
      name: "SIGMETs",
      state: vector.showSIGMETs,
      toggle: vectorActions.toggleSIGMETs,
    },
    {
      icon: <TriangleAlert className="shrink-0" />,
      type: "publicAlerts",
      name: "Public Alerts",
      state: vector.showPublicAlerts,
      toggle: vectorActions.togglePublicAlerts,
    },
  ] as const;

  // vector options config
  const OVERLAYS: ToggleDataOption[] = [
    {
      type: "fir",
      name: "FIR Boundaries",
      state: overlays.showFIR,
      toggle: overlayActions.toggleFir,
    },
    {
      type: "lgf",
      name: "LGF Boundaries",
      state: overlays.showLGF,
      toggle: overlayActions.toggleLgf,
    },
    {
      type: "gfa",
      name: "GFA Boundaries",
      state: overlays.showGFA,
      toggle: overlayActions.toggleGfa,
    },
    {
      type: "tafs",
      name: "TAF Sites",
      state: overlays.showTAFs,
      toggle: overlayActions.toggleTafs,
    },
    {
      type: "bedposts",
      name: "Hub Bedposts",
      state: overlays.showBedposts,
      toggle: overlayActions.toggleBedposts,
    },
    {
      type: "publicRegions",
      name: "Public Regions",
      state: overlays.showPublicRegions,
      toggle: overlayActions.togglePublicRegions,
    },
    {
      type: "marineRegions",
      name: "Marine Regions",
      state: overlays.showMarineRegions,
      toggle: overlayActions.toggleMarineRegions,
    },
  ] as const;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTitle content="Realtime Data Options" />
      <SheetDescription content="Change how and what realtime data is being displayed" />
      <SheetTrigger asChild>
        <Button size="icon" variant="floating" {...props}>
          <Layers />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-transparent border-none text-white p-2 overflow-y-auto"
        showCloseButton={false}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsOpen(false);
          }
        }}
      >
        <Accordion
          type="single"
          value={tab}
          onValueChange={UIActions.setLayersTab as (value: string) => void}
          className="gap-2 text-black my-4 p-2 bg-white border-neutral-800 rounded-md border drop-shadow-2xl"
        >
          <AccordionItem value="satellite">
            <AccordionTrigger
              value="satellite"
              className={`flex justify-center gap-2 font-bold text-lg bg-accent/80 hover:bg-accent text-white ${tab === "satellite" && "bg-accent rounded-b-none"}`}
            >
              <Satellite className="shrink-0 size-6" /> Satellite
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2 border border-accent rounded-b-md p-2 h-fit">
              {map.basemap !== "hillshade" && (
                <div className="text-sm text-neutral-800 text-center">
                  Satellite imagery is only available when the basemap is set to "Default"
                </div>
              )}
              <div className="flex max-lg:flex-col max-lg: gap-2 items-center">
                <DataToggle
                  disabled={map.basemap !== "hillshade"}
                  dataOption={{
                    name: "Show Satellite",
                    state: raster.showSatellite,
                    toggle: rasterActions.toggleSatellite,
                    type: "satellite",
                  }}
                  className="flex items-center justify-between p-2 rounded-md text-black border border-input max-lg:w-full lg:min-w-48"
                />
                <Select
                  value={raster.satelliteProduct}
                  onValueChange={(selectVal) =>
                    rasterActions.setSatelliteProduct(selectVal as SatelliteChannelsWMSName)
                  }
                >
                  <SelectTrigger
                    disabled={!raster.showSatellite || map.basemap !== "hillshade"}
                    className="w-full text-black"
                  >
                    <SelectValue placeholder="Select Satellite Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SATELLITE_CHANNELS) as SatelliteChannelsList[]).map((ch, index) => (
                      <SelectItem key={index} value={SATELLITE_CHANNELS[ch].wms}>
                        {SATELLITE_CHANNELS[ch].menuName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="radar">
            <AccordionTrigger
              value="radar"
              className={`flex justify-center gap-2 font-bold text-lg bg-accent/80 hover:bg-accent text-white ${tab === "radar" && "bg-accent rounded-b-none"}`}
            >
              <Radar className="shrink-0 size-6" /> Radar
            </AccordionTrigger>
            <AccordionContent className="border border-accent rounded-b-md p-2 h-fit">
              <DataToggle
                dataOption={{
                  name: "Show Radar",
                  state: raster.showRadar,
                  toggle: rasterActions.toggleRadar,
                  type: "radar",
                }}
                className="flex items-center justify-between p-2 rounded-md text-black border border-input"
              />
              <div className="grid lg:grid-cols-2 max-lg:gap-2">
                <Button
                  type="button"
                  variant="drawer"
                  onClick={() => rasterActions.setRadarProduct("RADAR_1KM_RRAI")}
                  disabled={!raster.showRadar}
                  className={`max-lg:rounded-md ${raster.radarProduct === "RADAR_1KM_RRAI" && "active"}`}
                >
                  <Droplet />
                  Rain Rate
                </Button>
                <Button
                  type="button"
                  variant="drawer"
                  onClick={() => rasterActions.setRadarProduct("RADAR_1KM_RSNO")}
                  disabled={!raster.showRadar}
                  className={`max-lg:rounded-md ${raster.radarProduct === "RADAR_1KM_RSNO" && "active"}`}
                >
                  <Snowflake />
                  Snow Rate
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="wxdata">
            <AccordionTrigger
              value="wxdata"
              className={`flex justify-center gap-2 font-bold text-lg bg-accent/80 hover:bg-accent text-white ${tab === "wxdata" && "bg-accent rounded-b-none"}`}
            >
              <CloudLightning className="shrink-0  size-6" /> Observations
            </AccordionTrigger>
            <AccordionContent className="border border-accent rounded-b-md p-2 h-fit">
              <div className="grid lg:grid-cols-2 max-lg:grid-cols-1 gap-2">
                {VECTOR_DATA_OPTIONS.map((item, i) => {
                  return (
                    <DataToggle
                      key={i}
                      dataOption={item}
                      className="flex items-center grow justify-between p-2 rounded-md text-black border border-input"
                    />
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="alerts">
            <AccordionTrigger
              value="alerts"
              className={`flex justify-center gap-2 font-bold text-lg bg-accent/80 hover:bg-accent text-white ${tab === "alerts" && "bg-accent rounded-b-none"}`}
            >
              <AlertTriangle className="shrink-0  size-6" /> SigWx and Alerts
            </AccordionTrigger>
            <AccordionContent className="border border-accent rounded-b-md p-2 h-fit">
              <div className="grid lg:grid-cols-2 max-lg:grid-cols-1 gap-2">
                {SIGWX_DATA_OPTIONS.map((item, i) => {
                  if (item.type === "publicAlerts") {
                    return (
                      <div key={i} className="lg:col-span-2 grid lg:grid-cols-2 max-lg:grid-cols-1 gap-2">
                        <DataToggle
                          key={i}
                          dataOption={item}
                          className="flex items-center grow justify-between p-2 rounded-md text-black border border-input"
                        />
                        <div className="flex max-lg:flex-col max-lg:gap-2">
                          <Button
                            variant="drawer"
                            onClick={() => vectorActions.togglePublicAlertsFilterLevel()}
                            className={`max-lg:rounded-md ${vector.alertsFilterLevel === "all" && "active"} ${vector.showPublicAlerts && "disabled:opacity-100"}`}
                            disabled={!vector.showPublicAlerts || vector.alertsFilterLevel === "all"}
                          >
                            <CirclePlus /> All Public Alerts
                          </Button>
                          <Button
                            variant="drawer"
                            onClick={() => vectorActions.togglePublicAlertsFilterLevel()}
                            className={`max-lg:rounded-md ${vector.alertsFilterLevel === "convective" && "active"} ${vector.showPublicAlerts && "disabled:opacity-100"}`}
                            disabled={!vector.showPublicAlerts || vector.alertsFilterLevel === "convective"}
                          >
                            <CloudLightning />
                            Convective Alerts Only
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <DataToggle
                      key={i}
                      dataOption={item}
                      className="flex items-center grow justify-between p-2 rounded-md text-black border border-input"
                    />
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="projection">
            <AccordionTrigger
              value="projection"
              className={`flex justify-center gap-2 font-bold text-lg bg-accent/80 hover:bg-accent text-white ${tab === "projection" && "bg-accent rounded-b-none"}`}
            >
              <Map className="shrink-0  size-6" /> Map View
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2 items-center border border-accent rounded-b-md p-2 h-fit">
              <h1 className="text-center w-full">Basemap Style</h1>
              <div className="flex max-lg:flex-col max-lg:gap-2 w-full">
                {BASEMAP_TYPES.map((type) => {
                  let buttonText = "";

                  switch (type) {
                    case "hillshade":
                      buttonText = "Default";
                      break;
                    case "liberty":
                      buttonText = "Navigation";
                      break;
                    case "aerial":
                      buttonText = "Satellite";
                      break;
                    default:
                      break;
                  }

                  return (
                    <Button
                      key={type}
                      type="button"
                      variant="drawer"
                      onClick={() => mapActions.setBaseMap(type)}
                      className={`group relative max-lg:rounded-md  overflow-hidden hover:bg-white bg-white ${map.basemap === type && "active"}`}
                    >
                      <img
                        className={`w-fit absolute transition-opacity ${map.basemap !== type && "group-hover:opacity-100 opacity-50"}`}
                        src={`/${type}.png`}
                      />
                      <span
                        className={`group absolute top-1/2 left-1/2 -translate-1/2 rounded-full border border-neutral-800 px-2 py-0.5 ${map.basemap === type ? "bg-accent" : "bg-neutral-800 group-hover:bg-accent"} text-white font-bold`}
                      >
                        {buttonText}
                      </span>
                    </Button>
                  );
                })}
              </div>

              <h1 className="text-center w-full">Projection</h1>
              <div className="flex max-lg:flex-col max-lg:gap-2 w-full">
                <Button
                  type="button"
                  variant="drawer"
                  onClick={() => mapActions.setProjection("globe")}
                  className={`max-lg:rounded-md ${map.projection === "globe" && "active"}`}
                >
                  <Globe className="shrink-0" />
                  Globe
                </Button>
                <Button
                  type="button"
                  variant="drawer"
                  onClick={() => mapActions.setProjection("mercator")}
                  className={`max-lg:rounded-md ${map.projection === "mercator" && "active"}`}
                >
                  <Grid3X3 className="shrink-0" />
                  Mercator
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="geography">
            <AccordionTrigger
              value="geography"
              className={`flex justify-center gap-2 font-bold text-lg bg-accent/80 hover:bg-accent text-white ${tab === "geography" && "bg-accent rounded-b-none"}`}
            >
              <List className="shrink-0 size-6" /> Geography
            </AccordionTrigger>
            <AccordionContent className="border border-accent rounded-b-md p-2 h-fit">
              <div className="grid lg:grid-cols-2 max-lg:grid-cols-1 gap-2">
                {OVERLAYS.map((item, i) => (
                  <DataToggle
                    key={i}
                    dataOption={item}
                    className="flex items-center grow justify-between p-2 rounded-md text-black border border-input"
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <Button onClick={() => setIsOpen(false)}>
            <X /> Close
          </Button>
        </Accordion>
      </SheetContent>
    </Sheet>
  );
}
