import { useState } from "react";

import {
  CloudLightning,
  Globe,
  Layers,
  Radar,
  Satellite,
  ScanEye,
  Map,
  List,
  FlameKindling,
  Thermometer,
  TriangleAlert,
  Droplet,
  Snowflake,
  Rss,
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
} from "@/stateStores/map/vectorData";
import type { SatelliteChannelsList, SatelliteChannelsWMSName, ToggleDataOption } from "@/lib/types";
import { useLayersTab, useUIActions } from "@/stateStores/map/ui";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import Button, { type ButtonProps } from "@/components/ui/Button";
import DataToggle from "@/components/ui/DataToggle";
import { useMapStateActions, useProjection } from "@/stateStores/map/mapView";
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

  const map = { projection: useProjection() };

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
      name: "Observations",
      state: vector.showObs,
      toggle: vectorActions.toggleObs,
    },
    {
      icon: <Rss className="shrink-0" />,
      type: "isobars",
      name: "MSLP",
      state: vector.showIsobars,
      toggle: vectorActions.toggleIsobars,
    },
    {
      icon: <Rss className="shrink-0" />,
      type: "isotherms",
      name: "TT",
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
    {
      icon: <TriangleAlert className="shrink-0" />,
      type: "publicAlerts",
      name: "Public Alerts",
      state: vector.showPublicAlerts,
      toggle: vectorActions.togglePublicAlerts,
    },
    {
      icon: <TriangleAlert className="shrink-0" />,
      type: "sigmet",
      name: "SIGMETs",
      state: vector.showSIGMETs,
      toggle: vectorActions.toggleSIGMETs,
    },
    // {
    //   type: "airmet",
    //   name: "AIRMETs",
    //   state: vector.showAIRMETs,
    //   toggle: vectorActions.toggleAIRMETs,
    // },
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
      <SheetContent side="left" className="border-black bg-gray-800 text-white p-4" showCloseButton={false}>
        <div className="text-black my-4 p-2 bg-white border-neutral-400 rounded-md border-px">
          <Accordion type="single" value={tab} onValueChange={UIActions.setLayersTab as (value: string) => void}>
            <AccordionItem value="satellite">
              <AccordionTrigger
                value="satellite"
                className="flex justify-center gap-2 font-bold text-lg bg-gray-600 text-white"
              >
                <Satellite className="shrink-0 size-6" /> Satellite
              </AccordionTrigger>
              <AccordionContent className="flex items-center gap-2 my-2 border-2 border-gray-600 rounded-md p-2">
                <DataToggle
                  dataOption={{
                    name: "Show Satellite",
                    state: raster.showSatellite,
                    toggle: rasterActions.toggleSatellite,
                    type: "satellite",
                  }}
                  className="flex items-center justify-between p-2 rounded-md text-black border border-input min-w-48"
                />
                <Select
                  value={raster.satelliteProduct}
                  onValueChange={(selectVal) =>
                    rasterActions.setSatelliteProduct(selectVal as SatelliteChannelsWMSName)
                  }
                >
                  <SelectTrigger disabled={!raster.showSatellite} className="w-full text-black">
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
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="radar">
              <AccordionTrigger
                value="radar"
                className="flex justify-center gap-2 font-bold text-lg bg-gray-600 text-white"
              >
                <Radar className="shrink-0 size-6" /> Radar
              </AccordionTrigger>
              <AccordionContent className="flex items-center gap-2 my-2 border-2 border-gray-600 rounded-md p-2">
                <DataToggle
                  dataOption={{
                    name: "Show Radar",
                    state: raster.showRadar,
                    toggle: rasterActions.toggleRadar,
                    type: "radar",
                  }}
                  className="flex items-center justify-between p-2 rounded-md text-black border border-input"
                />
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="drawer"
                    onClick={() => rasterActions.setRadarProduct("RADAR_1KM_RRAI")}
                    disabled={!raster.showRadar}
                    className={`${raster.radarProduct === "RADAR_1KM_RRAI" && "active"}`}
                  >
                    <Droplet />
                    Rain Rate
                  </Button>
                  <Button
                    type="button"
                    variant="drawer"
                    onClick={() => rasterActions.setRadarProduct("RADAR_1KM_RSNO")}
                    disabled={!raster.showRadar}
                    className={`${raster.radarProduct === "RADAR_1KM_RSNO" && "active"}`}
                  >
                    <Snowflake />
                    Snow Rate
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="other">
              <AccordionTrigger
                value="other"
                className="flex justify-center gap-2 font-bold text-lg bg-gray-600 text-white"
              >
                <CloudLightning className="shrink-0  size-6" /> Wx Plots
              </AccordionTrigger>
              <AccordionContent className="flex items-center gap-2 my-2 border-2 border-gray-600 rounded-md p-2">
                <div className="grid grid-cols-2 gap-2">
                  {VECTOR_DATA_OPTIONS.map((item, i) => (
                    <DataToggle
                      key={i}
                      dataOption={item}
                      className="flex items-center justify-between p-2 rounded-md text-black border border-input"
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="projection">
              <AccordionTrigger
                value="projection"
                className="flex justify-center gap-2 font-bold text-lg bg-gray-600 text-white"
              >
                <ScanEye className="shrink-0  size-6" /> Projection
              </AccordionTrigger>
              <AccordionContent className="flex items-center gap-2 my-2 border-2 border-gray-600 rounded-md p-2">
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="drawer"
                    onClick={() => mapActions.setProjection("globe")}
                    className={`${map.projection === "globe" && "active"}`}
                  >
                    <Globe className="me-2 size-6" />
                    Globe
                  </Button>
                  <Button
                    type="button"
                    variant="drawer"
                    onClick={() => mapActions.setProjection("mercator")}
                    className={`${map.projection === "mercator" && "active"}`}
                  >
                    <Map className="me-2 size-6" />
                    Mercator
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="overlays">
              <AccordionTrigger
                value="overlays"
                className="flex justify-center gap-2 font-bold text-lg bg-gray-600 text-white"
              >
                <List className="shrink-0  size-6" /> Geography
              </AccordionTrigger>
              <AccordionContent className="flex items-center gap-2 my-2 border-2 border-gray-600 rounded-md p-2">
                <div className="grid grid-cols-2 gap-2">
                  {OVERLAYS.map((item, i) => (
                    <DataToggle
                      key={i}
                      dataOption={item}
                      className="flex items-center justify-between p-2 rounded-md  text-black border border-input"
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
