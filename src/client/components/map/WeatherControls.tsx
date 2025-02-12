"use client";

import { useState } from "react";

import { MapIcon } from "lucide-react";

import { Description } from "@radix-ui/react-dialog";
import { useRasterData } from "../../stateStores/map/rasterData";

import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "../ui/drawer";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { SATELLITE_CHANNELS, SatelliteChannelsList, SatelliteChannelsWMSName } from "../../config/map";
import { Checkbox } from "../ui/checkbox";

export default function WeatherControls() {
  const rasterData = useRasterData((state) => state);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-0 left-0 ms-2 mb-2">
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <Description />
        <DrawerTitle />
        <DrawerTrigger asChild>
          <Button className="p-3 w-12 h-12">
            <MapIcon />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="border-black bg-neutral-800 text-white">
          <div className="mx-auto my-4 w-full max-w-sm p-2 bg-white border-neutral-400 rounded-md border-px">
            <Tabs defaultValue="satellite" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="satellite">Satellite</TabsTrigger>
                <TabsTrigger value="radar">Radar</TabsTrigger>
                <TabsTrigger value="overlays">Overlays</TabsTrigger>
              </TabsList>
              <TabsContent value="satellite" className="mt-4 space-y-4">
                <div className="flex items-center justify-between p-2 rounded-md  text-black border border-input">
                  <Label htmlFor="satellite-switch" className={rasterData.showSatellite ? "" : "text-neutral-400"}>
                    Show Satellite
                  </Label>
                  <Switch
                    id="satellite-switch"
                    checked={rasterData.showSatellite}
                    onCheckedChange={() => rasterData.toggleSatellite()}
                  />
                </div>
                <Select
                  defaultValue={rasterData.satelliteProduct}
                  onValueChange={(e) => rasterData.setSatelliteProduct(e as SatelliteChannelsWMSName)}
                >
                  <SelectTrigger disabled={!rasterData.showSatellite} className="w-full text-black">
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
              <TabsContent value="radar" className="mt-4 space-y-4">
                <div className="flex items-center justify-between p-2 rounded-md  text-black border border-input">
                  <Label htmlFor="radar-switch" className={rasterData.showRadar ? "" : "text-neutral-400"}>
                    Show Radar
                  </Label>
                  <Switch
                    id="radar-switch"
                    checked={rasterData.showRadar}
                    onCheckedChange={() => rasterData.toggleRadar()}
                  />
                </div>
                <div className="flex items-center">
                  <Button
                    variant={rasterData.radarProduct === "RADAR_1KM_RRAI" ? "selected" : "secondary"}
                    onClick={() => rasterData.setRadarProduct("RADAR_1KM_RRAI")}
                    disabled={!rasterData.showRadar}
                    className="w-full rounded-none rounded-s-md"
                  >
                    1KM Rain CAPPI
                  </Button>
                  <Button
                    variant={rasterData.radarProduct === "RADAR_1KM_RSNO" ? "selected" : "secondary"}
                    onClick={() => rasterData.setRadarProduct("RADAR_1KM_RSNO")}
                    disabled={!rasterData.showRadar}
                    className="w-full rounded-none rounded-e-md"
                  >
                    1KM Snow CAPPI
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="overlays" className="mt-4 space-y-4 text-black">
                {["Lightning", "Surface Observations", "PIREPs", "SIGMETs", "AIRMETs"].map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox id={item.toLowerCase().replace(/\s+/g, "-")} />
                    <Label htmlFor={item.toLowerCase().replace(/\s+/g, "-")}>{item}</Label>
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
