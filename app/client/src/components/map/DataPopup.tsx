import { SigWx } from "@/components/observations/SigWx";
import type { ParsedTAF } from "@/lib/types";
import { formatSigWx } from "@/lib/utils";
import { usePopupData, useUIActions } from "@/stateStores/map/ui";
import { useRef } from "react";

import { Popup, type PopupInstance } from "react-map-gl/maplibre";
import Button from "../ui/Button";
import { AlertTriangle, CircleAlert, Clock, OctagonAlert, OctagonX, Wind, X } from "lucide-react";
import type { WxOAlertMetadataProperties } from "@shared/lib/types";
import type { XmetEventData } from "@shared/lib/alphanumeric.types";
import { useStationDataForPopup } from "@/hooks/useStationDataForPopup";
import type { ParsedTrackPointProps } from "@shared/lib/hurricanes.types";

export const DataPopup = () => {
  const popupData = usePopupData();
  const { setPopupData } = useUIActions();
  const popupRef = useRef<PopupInstance>(null);
  const { data: stationData } = useStationDataForPopup();

  const handleClose = () => {
    popupRef.current?.remove();
    setPopupData(undefined);
  };

  if (!popupData || popupData.features.length === 0) return null;

  const featureList = popupData.features;

  const showArealFeatures = featureList.every((feature) => {
    const dataType = (feature.properties.dataType as string) || (feature.properties.data_type as string);
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
      latitude={popupData.lngLat.lat}
      longitude={popupData.lngLat.lng}
      offset={10}
      maxWidth={undefined}
      closeButton={false}
      closeOnMove={false}
      className="w-fit max-w-1/2 min-w-60 text-white bg-transparent"
    >
      <div className="flex flex-col gap-2 justify-center items-center">
        <div className="flex flex-col gap-2 max-h-[33dvh] w-full overflow-y-auto overflow-x-clip rounded-md ">
          {featureList
            .sort((a, b) => {
              if (a.properties.dataType === "publicAlert" && b.properties.dataType !== "publicAlert") {
                // sigmets are visually small, put them at the top
                if (b.properties.dataType === "sigmet") {
                  return 1;
                } else {
                  return -1;
                }
              } else if (a.properties.dataType !== "publicAlert" && b.properties.dataType === "publicAlert") {
                return 1;
              } else if (a.properties.dataType === "publicAlert" && b.properties.dataType === "publicAlert") {
                if (a.properties.type === "warning" && b.properties.type !== "warning") {
                  return -1;
                } else if (a.properties.type !== "warning" && b.properties.type === "warning") {
                  return 1;
                } else if (a.properties.type === "warning" && b.properties.type === "warning") {
                  if (a.properties.colour === "red" && b.properties.colour !== "red") {
                    return -1;
                  } else if (a.properties.colour !== "red" && b.properties.colour === "red") {
                    return 1;
                  } else if (a.properties.colour === "red" && b.properties.colour === "red") {
                    return 0;
                  } else if (a.properties.colour === "orange" && b.properties.colour !== "orange") {
                    return -1;
                  } else if (a.properties.colour !== "orange" && b.properties.colour === "orange") {
                    return 1;
                  } else if (a.properties.colour === "orange" && b.properties.colour === "orange") {
                    return 0;
                  } else if (a.properties.colour === "yellow" && b.properties.colour !== "yellow") {
                    return -1;
                  } else if (a.properties.colour !== "yellow" && b.properties.colour === "yellow") {
                    return 1;
                  } else if (a.properties.colour === "yellow" && b.properties.colour === "yellow") {
                    return 0;
                  }
                }
              }
              if (a.properties.dataType === "sigmet" && b.properties.dataType !== "sigmet") {
                return 1;
              } else if (a.properties.dataType !== "sigmet" && b.properties.dataType === "sigmet") {
                return -1;
              } else {
                return 0;
              }
            })
            .map((feature) => {
              const dataType = (feature.properties.dataType as string) || (feature.properties.data_type as string);

              switch (dataType) {
                case "site": {
                  // remember the MVT contains features in snake_case
                  const { site_id: siteId } = feature.properties as { site_id: string };

                  const popupData = stationData?.[siteId];

                  if (!popupData) return null;

                  const { siteCountry, siteState, siteName, metars, taf } = popupData;

                  const parsedMetar =
                    metars?.length > 0 ? (formatSigWx(metars[metars.length - 1], "metar") as string) : null;

                  const parsedTaf = taf ? (formatSigWx(taf, "taf") as ParsedTAF) : null;

                  return (
                    <div
                      key={siteId}
                      className="border border-neutral-600 rounded-md bg-radial-[at_0%_0%] from-neutral-700 to-neutral-800 to-90%"
                    >
                      <h1 className="font-bold mb-1 text-center bg-neutral-600 px-2 py-0.5">
                        {siteName}, {siteCountry === "US" || siteCountry === "CA" ? siteState : siteCountry}
                      </h1>
                      <div className="font-mono px-2">
                        {parsedMetar && (
                          <div className="-indent-2 ms-2">
                            <SigWx text={parsedMetar} />
                          </div>
                        )}
                        {!showArealFeatures && !hasOtherMetars && (
                          <>
                            {parsedTaf?.main && (
                              <div className="border-t mt-2 pt-2 ms-2 -indent-2">
                                <SigWx text={parsedTaf.main} />
                              </div>
                            )}
                            {parsedTaf?.partPeriods?.map((p, i) => (
                              <div className={`${p.startsWith("FM") ? "-indent-2 ms-4" : "-indent-4 ms-8"}`} key={i}>
                                <SigWx text={p} />
                              </div>
                            ))}
                            {parsedTaf?.rmk && <div className="ms-4 -indent-2">{parsedTaf.rmk}</div>}
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
                case "sigmet": {
                  if (!showArealFeatures) return null;
                  const sigmetProps = feature.properties as XmetEventData;

                  const hazard = sigmetProps.hazard;
                  const motionVector = sigmetProps.motionVector;

                  const hazardEventName = hazard.type === "VA" || hazard.type === "TC" ? hazard.name : null;

                  return (
                    <div
                      key={sigmetProps.sequenceId}
                      className={`text-[0.6rem] font-bold bg-linear-to-r from-red-800 to-red-900 rounded-md p-1
                      `}
                    >
                      <div className="flex justify-around font-mono text-center place-items-center">
                        <div className="flex place-items-center gap-1 justify-center">
                          <AlertTriangle size={12} />
                          {hazard.type} {hazardEventName ? `${hazardEventName} ` : ""}
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
                case "publicAlert": {
                  if (!showArealFeatures) return null;
                  const alertProps = feature.properties as WxOAlertMetadataProperties;

                  const headerColour =
                    alertProps.colour === "red"
                      ? "bg-linear-to-r from-red-800 to-red-900"
                      : alertProps.colour === "yellow"
                        ? "bg-linear-to-r from-yellow-400 to-yellow-300"
                        : alertProps.colour === "orange"
                          ? "bg-linear-to-r from-orange-700 to-orange-600"
                          : "bg-linear-to-r from-neutral-500 to-neutral-400";
                  const textColour = alertProps.colour === "yellow" ? "text-black" : "text-white";

                  return (
                    <div
                      key={new Date(alertProps.issueTime).getTime()}
                      className="border rounded-md border-neutral-600"
                    >
                      <div
                        className={`grid grid-cols-7 gap-2 items-center text-center ${headerColour} ${textColour} rounded-t p-2`}
                      >
                        <div className="flex justify-center">
                          {alertProps.type !== "watch" && alertProps.type !== "warning" && <CircleAlert />}
                          {alertProps.type === "watch" && <OctagonAlert />}
                          {alertProps.type === "warning" && <OctagonX />}
                        </div>
                        <h1 className="col-span-6 flex gap-1 items-center font-bold justify-left">
                          {alertProps.bannerText}
                        </h1>
                      </div>
                      <div className="p-2 whitespace-pre-wrap">{alertProps.text}</div>
                    </div>
                  );
                }
                case "hurricane": {
                  const hurricaneProps = feature.properties as ParsedTrackPointProps;

                  const subType = hurricaneProps.metobject.sub_type;
                  const stormType =
                    subType === "STORM"
                      ? "Tropical Storm"
                      : subType === "POST-TROPICAL"
                        ? "Post-Tropical Storm"
                        : `${subType.slice(0, 1)}${subType.slice(1).toLowerCase()}`;

                  return (
                    <div className="flex flex-col gap-2 items-center border-neutral-950 border rounded-lg">
                      <h1 className="w-full font-bold text-base text-center p-2 border-b border-neutral-950 rounded-t-lg bg-linear-to-r from-red-800 to-red-900">
                        {stormType} {hurricaneProps.storm_name}
                        {hurricaneProps.category && ` (Cat ${hurricaneProps.category})`}
                      </h1>

                      <div className="p-1">
                        <div className="flex gap-2 items-center">
                          <Clock />
                          {new Date(hurricaneProps.forecast_datetime).toLocaleString("en-CA", {
                            hour12: false,
                            month: "short",
                            day: "numeric",

                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "UTC",
                            timeZoneName: "short",
                          })}
                        </div>
                        <div className="flex gap-2 items-center">
                          <Wind />
                          Max Wind: {hurricaneProps.metobject.max_wind.value}KT
                        </div>
                      </div>
                    </div>
                  );
                }
                default:
                  return null;
              }
            })}
        </div>

        <Button className="w-full" variant={"default"} onClick={handleClose}>
          <X />
          Close
        </Button>
        {/* <Button className="mt-2" variant={"default"} onClick={handleClose}>
          <Plus />
          More Info
        </Button> */}
      </div>
    </Popup>
  );
};
