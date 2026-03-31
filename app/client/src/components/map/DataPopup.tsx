import { useHighlightSigWx } from "@/hooks/useHighlightSigWx";
import type { ParsedTAF } from "@/lib/types";
import { checkIfInBounds, formatSigWx } from "@/lib/utils";
import { usePopupData, useUIActions } from "@/stateStores/map/ui";
import { useRef } from "react";
import { Popup, type PopupInstance } from "react-map-gl/maplibre";
import Button from "../ui/Button";
import { AlertTriangle, CircleAlert, OctagonAlert, OctagonX, X } from "lucide-react";
import { useViewportBounds } from "@/stateStores/map/mapView";
import type { StationPlotPopupData, WarningProperties } from "@shared/lib/types";
import type { XmetEventData } from "@shared/lib/alphanumeric.types";

const extractEventName = (text: string): string | null => {
  const eventNameMatch = text.match(/(VA ERUPTION MT|VA|TC)\s+([A-Z0-9]+)/);
  if (eventNameMatch) {
    return eventNameMatch[2].trim();
  } else {
    return null;
  }
};

export const DataPopup = () => {
  const popupData = usePopupData();
  const { setPopupData } = useUIActions();
  const popupRef = useRef<PopupInstance>(null);
  const viewport = useViewportBounds();

  const handleClose = () => {
    popupRef.current?.remove();
  };

  const { highlightSigWx } = useHighlightSigWx();

  if (!viewport || !popupData || popupData.features.length === 0) return null;

  const { lng, lat } = popupData.lngLat;

  // if we move the map too far from the popup, close it
  if (!checkIfInBounds([lng, lat], viewport)) handleClose();

  const featureList = popupData.features;

  const hasOtherFeatures = featureList.some((feature) => {
    const dataType = feature.properties.dataType as string;
    return dataType !== "site";
  });

  const hasOtherMetars =
    featureList.reduce((count, feature) => {
      const dataType = feature.properties.dataType as string;
      if (dataType === "site") count += 1;
      return count;
    }, 0) > 1;

  return (
    <Popup
      ref={popupRef}
      latitude={lat}
      longitude={lng}
      offset={10}
      maxWidth="inherit"
      onClose={() => setPopupData(undefined)}
      closeButton={false}
      closeOnMove={false}
      className="md:w-100 max-md:w-60 max-w-3/4 text-white bg-transparent"
    >
      <div className="flex flex-col gap-2 justify-center items-center">
        <div className="flex flex-col gap-2 max-h-[33dvh] w-full overflow-y-auto">
          {featureList
            .sort((a, b) => {
              if (a.properties.dataType === "sigmet" && b.properties.dataType !== "sigmet") {
                return -1;
              } else if (a.properties.dataType !== "sigmet" && b.properties.dataType === "sigmet") {
                return 1;
              } else {
                return 0;
              }
            })
            .map((feature) => {
              const dataType = feature.properties.dataType as string;

              switch (dataType) {
                case "site": {
                  const { siteId, siteCountry, siteState, siteName, metars, taf } =
                    feature.properties as StationPlotPopupData;

                  const metarArray = JSON.parse(metars as unknown as string) as string[];

                  const parsedMetar =
                    metarArray.length > 0 ? (formatSigWx(metarArray[metarArray.length - 1], "metar") as string) : null;

                  const parsedTaf = taf ? (formatSigWx(taf, "taf") as ParsedTAF) : null;

                  return (
                    <div key={siteId}>
                      <h1 className="font-bold mb-1 text-center">
                        {siteName}, {siteCountry === "US" || siteCountry === "CA" ? siteState : siteCountry}
                      </h1>
                      <div className="font-mono">
                        {parsedMetar && <div className="-indent-2 ms-2">{highlightSigWx(parsedMetar)}</div>}
                        {!hasOtherFeatures && !hasOtherMetars && (
                          <>
                            {parsedTaf?.main && (
                              <div className="border-t mt-2 pt-2 max-md:hidden ms-2 -indent-2">
                                {highlightSigWx(parsedTaf.main)}
                              </div>
                            )}
                            {parsedTaf?.partPeriods?.map((p, i) => (
                              <div
                                className={`max-md:hidden ${p.startsWith("FM") ? "-indent-2 ms-4" : "-indent-4 ms-8"}`}
                                key={i}
                              >
                                {highlightSigWx(p)}
                              </div>
                            ))}
                            {parsedTaf?.rmk && <div className="max-md:hidden ms-4 -indent-2">{parsedTaf.rmk}</div>}
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
                case "sigmet": {
                  const sigmetProps = feature.properties as XmetEventData;

                  const hazard = JSON.parse(sigmetProps.hazard as unknown as string) as XmetEventData["hazard"];
                  const motionVector = JSON.parse(
                    sigmetProps.motionVector as unknown as string,
                  ) as XmetEventData["motionVector"];

                  // const isUsaSigmet =
                  //   sigmetProps.issuer === "KKCI" || sigmetProps.issuer === "PAWU" || sigmetProps.issuer === "PHFO";

                  const hazardEventName =
                    hazard.type === "VA" || hazard.type === "TC" ? extractEventName(sigmetProps.text) : null;

                  return (
                    <div
                      key={sigmetProps.sequenceId}
                      className={`text-[0.6rem] font-bold bg-red-800 rounded-md p-1
                      `}
                    >
                      <div className="flex justify-around font-mono text-center place-items-center">
                        <div className="flex place-items-center gap-1 justify-center">
                          <AlertTriangle size={12} />
                          {hazard.type} {hazardEventName ? `${hazardEventName} ` : " "}
                        </div>

                        <div>
                          <div>{hazard.top || "//"}</div>
                          {hazard.top && <div className="border-t border-white">{hazard.bottom || "XX"}</div>}
                        </div>
                        <div>{hazard.trend || "//"}</div>
                        <div>
                          {motionVector.direction === 0 && motionVector.speed === 0 ? (
                            "STNR"
                          ) : (
                            <>
                              <div>{`${motionVector.direction}°`}</div>
                              <div>{`${motionVector.speed}KT`}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                case "publicAlert":
                  const alertProps = feature.properties as WarningProperties;

                  const headerColour =
                    alertProps.type === "warning"
                      ? "bg-red-800"
                      : alertProps.type === "watch"
                        ? "bg-yellow-400"
                        : "bg-neutral-400";

                  return (
                    <div
                      key={new Date(alertProps.issueTime).getTime()}
                      className={`grid grid-cols-7 gap-2  items-center text-center ${headerColour} rounded-md p-2`}
                    >
                      <div className="flex justify-center">
                        {alertProps.type !== "watch" && alertProps.type !== "warning" && <CircleAlert />}
                        {alertProps.type === "watch" && <OctagonAlert />}
                        {alertProps.type === "warning" && <OctagonX />}
                      </div>
                      <div className=" col-span-6 flex gap-1 items-center font-bold justify-left">
                        {alertProps.alertBannerText}
                      </div>
                    </div>
                  );
              }

              return null;
            })}
        </div>

        <Button className="max-w-40" variant={"default"} onClick={handleClose}>
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
