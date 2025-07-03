import { useState } from "react";

import { CloudLightning, Layers, Radar, Satellite } from "lucide-react";

import { SATELLITE_CHANNELS } from "@/config/map";

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
} from "@/stateStores/map/vectorData";
import { SatelliteChannelsList, SatelliteChannelsWMSName, ToggleDataOption } from "@/lib/types";
import { useLayersTab, useUIActions } from "@/stateStores/map/ui";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "../ui/Drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import Button, { ButtonProps } from "../ui/Button";
import DataToggle from "./DataToggle";

export default function OptionsRealtimeData({ ...props }: ButtonProps) {
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
  };

  const raster = {
    showSatellite: useShowSatellite(),
    showRadar: useShowRadar(),
    satelliteProduct: useSatelliteProduct(),
    radarProduct: useRadarProduct(),
  };

  const tab = useLayersTab();

  const rasterActions = useRasterStateActions();
  const vectorActions = useVectorActions();
  const UIActions = useUIActions();

  // vector options config
  const VECTOR_DATA_OPTIONS: ToggleDataOption[] = [
    { type: "aq", name: "PM 2.5μm", state: vector.useShowAQ, toggle: vectorActions.toggleAQ },
    {
      type: "lightning",
      name: "Lightning",
      state: vector.showLightning,
      toggle: vectorActions.toggleLightning,
    },
    // {
    //   type: "surfaceObs",
    //   name: "Surface Observations",
    //   state: vector.showObs,
    //   toggle: vectorActions.toggleObs,
    // },
    {
      type: "pirep",
      name: "PIREPs",
      state: vector.showPIREPs,
      toggle: vectorActions.togglePIREPs,
    },
    {
      type: "sigmet",
      name: "SIGMETs",
      state: vector.showSIGMETs,
      toggle: vectorActions.toggleSIGMETs,
    },
    {
      type: "airmet",
      name: "AIRMETs",
      state: vector.showAIRMETs,
      toggle: vectorActions.toggleAIRMETs,
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
          <div className="text-black mx-auto my-4 w-full max-w-md p-2 bg-white border-neutral-400 rounded-md border-px">
            <Tabs
              value={tab}
              onValueChange={UIActions.setLayersTab as (value: string) => void}
              className="w-full min-h-[25svh]"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="other">
                  <CloudLightning className="me-2 size-6" />
                  Wx Plots
                </TabsTrigger>
                <TabsTrigger value="satellite">
                  <Satellite className="me-2 size-6" />
                  Satellite
                </TabsTrigger>
                <TabsTrigger value="radar">
                  <Radar className="me-2 size-6" />
                  Radar
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
                    1KM Rain CAPPI
                  </Button>
                  <Button
                    type="button"
                    variant="drawer"
                    onClick={() => rasterActions.setRadarProduct("RADAR_1KM_RSNO")}
                    disabled={!raster.showRadar}
                    className={`${raster.radarProduct === "RADAR_1KM_RSNO" && "active"}`}
                  >
                    1KM Snow CAPPI
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
            </Tabs>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
