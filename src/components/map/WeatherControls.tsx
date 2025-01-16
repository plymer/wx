"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { MapIcon } from "lucide-react";

import { SATELLITE_CHANNELS } from "@/config/satellite";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "../ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useMapConfigContext } from "@/contexts/mapConfigContext";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import { Description } from "@radix-ui/react-dialog";
// import { Label } from "../ui/label";
// import { Switch } from "../ui/switch";
// import { Checkbox } from "../ui/checkbox";

export default function WeatherControls() {
  const mapConfig = useMapConfigContext();
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
        <DrawerContent className="border-black bg-accent text-white">
          <div className="mx-auto my-4 w-full max-w-sm">
            <Tabs defaultValue="satellite" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="satellite">Satellite</TabsTrigger>
                <TabsTrigger value="radar">Radar</TabsTrigger>
                <TabsTrigger value="overlays">Overlays</TabsTrigger>
              </TabsList>
              <TabsContent value="satellite" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="satellite-switch">Satellite</Label>
                  <Switch
                    id="satellite-switch"
                    checked={mapConfig.showSatellite}
                    onCheckedChange={(e) => mapConfig.setShowSatellite!(e)}
                  />
                </div>
                <Select
                  defaultValue={mapConfig.satelliteProduct}
                  onValueChange={(e) => mapConfig.setSatelliteProduct!(e)}
                >
                  <SelectTrigger className="w-full text-black">
                    <SelectValue placeholder="Select Satellite Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {SATELLITE_CHANNELS.map((ch, index) => (
                      <SelectItem key={index} value={ch.wms}>
                        {ch.menuName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              <TabsContent value="radar" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="radar-switch">Radar</Label>
                  <Switch
                    id="radar-switch"
                    checked={mapConfig.showRadar}
                    onCheckedChange={(e) => mapConfig.setShowRadar!(e)}
                  />
                </div>
                <div className="flex items-center">
                  <Button
                    variant={mapConfig.radarProduct === "RADAR_1KM_RRAI" ? "default" : "secondary"}
                    onClick={() => mapConfig.setRadarProduct!("RADAR_1KM_RRAI")}
                    className="w-full"
                  >
                    Rain
                  </Button>
                  <Button
                    variant={mapConfig.radarProduct === "RADAR_1KM_RSNO" ? "default" : "secondary"}
                    onClick={() => mapConfig.setRadarProduct!("RADAR_1KM_RSNO")}
                    className="w-full"
                  >
                    Snow
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="overlays" className="mt-4 space-y-4">
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
