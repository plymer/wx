import { useState } from "react";

import { Database, Globe, Globe2, List, Map, ScanEye } from "lucide-react";

import { ToggleDataOption } from "../../lib/types";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "../ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import Button from "../ui/button";
import {
  useBedpostsOverlay,
  useFIROverlay,
  useGFAOverlay,
  useLGFOverlay,
  useMarineRegionsOverlay,
  usePublicRegionsOverlay,
  useTAFsOverlay,
  useVectorOverlayActions,
} from "../../stateStores/map/vectorOverlays";
import { useMapStateActions, useProjection } from "../../stateStores/map/mapView";
import { useMapOptionsTab, useUIActions } from "../../stateStores/map/ui";

interface Props {
  className?: string;
}

export default function RealtimeOptions({ className }: Props) {
  // local state
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // global state
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

  const tab = useMapOptionsTab();

  const overlayActions = useVectorOverlayActions();
  const mapActions = useMapStateActions();
  const UIActions = useUIActions();

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
        <DrawerTitle content="Map View Options" />
        <DrawerDescription content="Change the map projection and what types of overlays are displayed" />
        <DrawerTrigger asChild>
          <Button variant="floatingIcon" className={className}>
            <Globe2 />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="border-black bg-gray-800 text-white">
          <div className="text-black mx-auto my-4 w-full max-w-md p-2 bg-white border-neutral-400 rounded-md border-px">
            <Tabs defaultValue={tab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="projection" onClick={() => UIActions.setMapOptionsTab("projection")}>
                  <ScanEye className="me-2" />
                  Projection
                </TabsTrigger>
                <TabsTrigger value="overlays" onClick={() => UIActions.setMapOptionsTab("overlays")}>
                  <List className="me-2" />
                  Geography
                </TabsTrigger>
              </TabsList>

              <TabsContent value="projection">
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="drawer"
                    onClick={() => mapActions.setProjection("globe")}
                    className={`${map.projection === "globe" && "active"}`}
                  >
                    <Globe className="me-2" />
                    Globe
                  </Button>
                  <Button
                    type="button"
                    variant="drawer"
                    onClick={() => mapActions.setProjection("mercator")}
                    className={`${map.projection === "mercator" && "active"}`}
                  >
                    <Map className="me-2" />
                    Mercator
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="overlays">
                {OVERLAYS.map((item, i) => (
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
