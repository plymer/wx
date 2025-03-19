import { useState } from "react";

import { CloudLightning, Layers, MapIcon, Radar, Satellite } from "lucide-react";

import { SATELLITE_CHANNELS, SatelliteChannelsList, SatelliteChannelsWMSName } from "../../config/map";

import {
  useRadarProduct,
  useRasterStateActions,
  useSatelliteProduct,
  useShowRadar,
  useShowSatellite,
} from "../../stateStores/map/rasterData";
import {
  useShowAIRMETs,
  useShowLightning,
  useShowObs,
  useShowPIREPs,
  useShowSIGMETs,
  useVectorActions,
} from "../../stateStores/map/vectorData";
import { ToggleDataOption } from "../../lib/types";
import { useLayersTab, useUIActions } from "../../stateStores/map/ui";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "../ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import Button from "../ui/button";

interface Props {
  className?: string;
}

export default function RealtimeOptions({ className }: Props) {
  // local state
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // global state
  const vector = {
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
          <Button variant="floatingIcon" className={className}>
            <Layers />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="border-black bg-gray-800 text-white">
          <div className="text-black mx-auto my-4 w-full max-w-md p-2 bg-white border-neutral-400 rounded-md border-px">
            <Tabs defaultValue={tab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="other" onClick={() => UIActions.setLayersTab("other")}>
                  <CloudLightning className="me-2" />
                  Wx Elements
                </TabsTrigger>
                <TabsTrigger value="satellite" onClick={() => UIActions.setLayersTab("satellite")}>
                  <Satellite className="me-2" />
                  Satellite
                </TabsTrigger>
                <TabsTrigger value="radar" onClick={() => UIActions.setLayersTab("radar")}>
                  <Radar className="me-2" />
                  Radar
                </TabsTrigger>
              </TabsList>
              <TabsContent value="satellite">
                <div className="flex items-center justify-between p-2 rounded-md  text-black border border-input">
                  <Label
                    htmlFor="satellite-switch"
                    className={`${raster.showSatellite ? "" : "text-neutral-400"} cursor-pointer`}
                  >
                    Show Satellite
                  </Label>
                  <Switch
                    name="satellite-switch"
                    checked={raster.showSatellite}
                    onCheckedChange={() => rasterActions.toggleSatellite()}
                  />
                </div>
                <Select
                  defaultValue={raster.satelliteProduct}
                  onValueChange={(e) => rasterActions.setSatelliteProduct(e as SatelliteChannelsWMSName)}
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
                <div className="flex items-center justify-between p-2 rounded-md  text-black border border-input">
                  <Label
                    htmlFor="radar-switch"
                    className={`${raster.showRadar ? "" : "text-neutral-400"} cursor-pointer`}
                  >
                    Show Radar
                  </Label>
                  <Switch
                    name="radar-switch"
                    checked={raster.showRadar}
                    onCheckedChange={() => rasterActions.toggleRadar()}
                  />
                </div>
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
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md  text-black border border-input"
                  >
                    <Label
                      htmlFor={item.name.toLowerCase().replace(/\s+/g, "-")}
                      className={`${item.state ? "" : "text-neutral-400"} cursor-pointer`}
                    >
                      {item.name}
                    </Label>
                    <Switch
                      id={item.name.toLowerCase().replace(/\s+/g, "-")}
                      checked={item.state}
                      onCheckedChange={() => item.toggle()}
                    />
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
