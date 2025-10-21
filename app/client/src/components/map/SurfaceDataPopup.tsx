import { useHighlightSigWx } from "@/hooks/useHighlightSigWx";
import { ParsedTAF } from "@/lib/types";
import { checkIfInBounds, formatSigWx } from "@/lib/utils";
import { usePopupData, useUIActions } from "@/stateStores/map/ui";
import { useRef } from "react";
import { Popup, PopupInstance } from "react-map-gl/maplibre";
import Button from "../ui/Button";
import { X } from "lucide-react";
import { useViewportBounds } from "@/stateStores/map/mapView";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";

export const SurfaceDataPopup = () => {
  const popupData = usePopupData();
  const { setPopupData } = useUIActions();
  const popupRef = useRef<PopupInstance>(null);
  const viewport = useViewportBounds();

  const handleClose = () => {
    popupRef.current?.remove();
  };

  const { highlightSigWx } = useHighlightSigWx();

  const { data } = useQuery(
    api.wxmap.wxmapPopup.queryOptions(
      { siteId: popupData?.features.map((f) => (f as any).properties.siteId).join(",") },
      { enabled: !!popupData },
    ),
  );

  if (!viewport || !data || !popupData || popupData.features.length === 0) return null;

  const { lng, lat } = popupData.lngLat;

  // if we move the map too far from the popup, close it
  if (!checkIfInBounds([lng, lat], viewport)) handleClose();

  const metarsFromData = data;

  return (
    <Popup
      ref={popupRef}
      latitude={lat}
      longitude={lng}
      offset={15}
      onClose={() => setPopupData(undefined)}
      closeButton={false}
      closeOnMove={false}
      className="w-[400px] max-w-3/4 text-white drop-shadow-2xl bg-transparent"
    >
      <div className="flex flex-col justify-center">
        {Object.entries(metarsFromData).map(([_siteId, entries], i) => {
          const parsedMetar =
            entries.metars.length > 0
              ? (formatSigWx(entries.metars[entries.metars.length - 1], "metar") as string)
              : null;

          const parsedTaf =
            Object.entries(metarsFromData).length <= 1 && entries.tafs.length > 0
              ? (formatSigWx(entries.tafs[entries.tafs.length - 1], "taf") as ParsedTAF)
              : null;

          const { siteName, siteCountry, siteState } = entries.metaData;

          return (
            <>
              <div key={i} className="p-2 border-b last:border-0 border-white/20 even:bg-black/20">
                <h1 className="font-bold mb-1 text-center">
                  {siteName}, {siteCountry === "US" || siteCountry === "CA" ? siteState : siteCountry}
                </h1>
                <div className="font-mono">
                  {parsedMetar && <div>{highlightSigWx(parsedMetar)}</div>}
                  {parsedTaf?.main && (
                    <div className="border-t mt-2 pt-2 max-md:hidden">{highlightSigWx(parsedTaf.main)}</div>
                  )}
                  {parsedTaf?.partPeriods?.map((p, i) => (
                    <div className={`ms-8 max-md:hidden ${p.startsWith("FM") ? "-indent-6" : "-indent-4"}`} key={i}>
                      {highlightSigWx(p)}
                    </div>
                  ))}
                  {parsedTaf?.rmk && <div className="max-md:hidden">{parsedTaf.rmk}</div>}
                </div>
              </div>
            </>
          );
        })}
        <Button className="mt-2" variant={"default"} onClick={handleClose}>
          <X />
          Close Details
        </Button>
        {/* <Button className="mt-2" variant={"default"} onClick={handleClose}>
          <Plus />
          More Info
        </Button> */}
      </div>
    </Popup>
  );
};
