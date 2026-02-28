import { useState } from "react";

import { CloudLightning, Globe, Layers, Radar, Satellite, ScanEye, Map, List } from "lucide-react";

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
} from "@/stateStores/map/vectorData";
import type { SatelliteChannelsList, SatelliteChannelsWMSName, ToggleDataOption } from "@/lib/types";
import { useLayersTab, useUIActions } from "@/stateStores/map/ui";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@/components/ui/Drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
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
    { type: "aq", name: "PM 2.5μm", state: vector.useShowAQ, toggle: vectorActions.toggleAQ },
    {
      type: "lightning",
      name: "Lightning",
      state: vector.showLightning,
      toggle: vectorActions.toggleLightning,
    },
    {
      type: "surfaceObs",
      name: "Surface Observations",
      state: vector.showObs,
      toggle: vectorActions.toggleObs,
    },
    // {
    //   type: "pirep",
    //   name: "PIREPs",
    //   state: vector.showPIREPs,
    //   toggle: vectorActions.togglePIREPs,
    // },
    {
      type: "publicAlerts",
      name: "Public Alerts",
      state: vector.showPublicAlerts,
      toggle: vectorActions.togglePublicAlerts,
    },
    {
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
    <div className="w-full">
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTitle content="Realtime Data Options" />
        <DrawerDescription content="Change how and what realtime data is being displayed" />
        <DrawerTrigger asChild>
          <Button size="icon" variant="floating" {...props}>
            <Layers />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="border-black bg-gray-800 text-white">
          <div className="text-black mx-auto my-4 w-fit p-2 bg-white border-neutral-400 rounded-md border-px">
            <Tabs
              value={tab}
              onValueChange={UIActions.setLayersTab as (value: string) => void}
              className="w-full min-h-[25svh]"
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="other" className="flex justify-center gap-2">
                  <CloudLightning className="shrink-0  size-6" />
                  <span className="max-md:hidden">Wx Plots</span>
                </TabsTrigger>
                <TabsTrigger value="satellite" className="flex justify-center gap-2">
                  <Satellite className="shrink-0  size-6" />
                  <span className="max-md:hidden">Satellite</span>
                </TabsTrigger>
                <TabsTrigger value="radar" className="flex justify-center gap-2">
                  <Radar className="shrink-0 size-6" />
                  <span className="max-md:hidden">Radar</span>
                </TabsTrigger>
                <TabsTrigger value="projection" className="flex justify-center gap-2">
                  <ScanEye className="shrink-0  size-6" />
                  <span className="max-md:hidden">Projection</span>
                </TabsTrigger>
                <TabsTrigger value="overlays" className="flex justify-center gap-2">
                  <List className="shrink-0  size-6" />
                  <span className="max-md:hidden">Geography</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="satellite">
                <DataToggle
                  dataOption={{
                    name: "Show Satellite",
                    state: raster.showSatellite,
                    toggle: rasterActions.toggleSatellite,
                    type: "satellite",
                  }}
                  className="flex items-center justify-between p-2 rounded-md text-black border border-input"
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
              </TabsContent>
              <TabsContent value="radar">
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
                    Rain Rate
                  </Button>
                  <Button
                    type="button"
                    variant="drawer"
                    onClick={() => rasterActions.setRadarProduct("RADAR_1KM_RSNO")}
                    disabled={!raster.showRadar}
                    className={`${raster.radarProduct === "RADAR_1KM_RSNO" && "active"}`}
                  >
                    Snow Rate
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="other">
                {VECTOR_DATA_OPTIONS.map((item, i) => (
                  <DataToggle
                    key={i}
                    dataOption={item}
                    className="flex items-center justify-between p-2 rounded-md text-black border border-input"
                  />
                ))}
              </TabsContent>
              <TabsContent value="projection">
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
              </TabsContent>
              <TabsContent value="overlays">
                <div className="grid grid-cols-2 gap-2">
                  {OVERLAYS.map((item, i) => (
                    <DataToggle
                      key={i}
                      dataOption={item}
                      className="flex items-center justify-between p-2 rounded-md  text-black border border-input"
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
