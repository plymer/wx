import { useBulletin, useCoords, useMode, useOffice, usePublicActions } from "@/stateStores/public";

import { PUBLIC_FORECAST_CONFIG } from "../config/public";
import { api } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { useQuery } from "@tanstack/react-query";
import { MINUTE } from "@shared/lib/constants";
import Button from "./ui/Button";
import { Label } from "./ui/Label";
import { Calendar, Info, OctagonX } from "lucide-react";
import { PointForecastMap } from "./public/PointForecastMap";
import type { Position } from "geojson";
import { AlertsModal } from "./public/AlertsModal";
import { NormalsContainer } from "./public/NormalsContainer";
import { WxIcon } from "./public/WxIcon";
import { CurrentConditions } from "./public/CurrentConditions";

export default function Public() {
  const office = useOffice();
  const bulletin = useBulletin();
  const mode = useMode();
  const pointCoords = useCoords();

  const { setOffice, setBulletin, setMode } = usePublicActions();

  const [searchCoords, setSearchCoords] = useState<Position | null>(null);

  const [productList, setProductList] = useState<Record<string, string>>({});
  const [issuerCode, setIssuerCode] = useState("");
  const [productCode, setProductCode] = useState("");

  const handleTextClick = () => setMode("text");
  const handlePointClick = () => setMode("point");

  // right now, this effect fires whenever we change the office OR the bulletin
  // but we actually need different logic for each of those cases
  // when we change bulletin, update the issuer code and product code because each office can cover multiple issuers

  // BUT

  // when we change the office, we should try to default the product selected back to the first product in the list, unless the current bulletin is still valid for the new office (i.e. in the case of the FOCN45CWWG product, which is available in multiple offices)

  useEffect(() => {
    const products = PUBLIC_FORECAST_CONFIG[office].products;
    const issuer = bulletin.slice(-4);
    const product = bulletin.slice(0, 6);

    setProductList(products);
    setIssuerCode(issuer);
    setProductCode(product);

    return () => {
      setProductList({});
      setIssuerCode("");
      setProductCode("");
    };
  }, [office, bulletin]);

  const { data: bulletinContent, fetchStatus } = useQuery(
    api.alpha.publicBulletin.queryOptions(
      { office: issuerCode, bulletin: productCode },
      { refetchInterval: 10 * MINUTE },
    ),
  );

  const {
    data: pointForecast,
    error,
    fetchStatus: pointFetchStatus,
  } = useQuery(
    api.alpha.pointForecast.queryOptions(
      { lat: searchCoords?.[1], lon: searchCoords?.[0] },
      { enabled: mode === "point" && searchCoords !== null },
    ),
  );

  useEffect(() => {
    // search when the component mounts if there are coords already saved from last time
    if (pointCoords) {
      setSearchCoords(pointCoords);
    }
  }, []);

  const productKey = `${productCode}${issuerCode}`;
  const productName = productList[productKey as keyof typeof productList];

  const currentConditions = pointForecast?.currentConditions;
  const conditionsTime = currentConditions?.time ? new Date(currentConditions?.time) : null;
  const conditionsTimeString = conditionsTime
    ? conditionsTime.toISOString().replace("T", " ").slice(0, -8) + "Z"
    : "N/A";
  const normals = pointForecast?.normals;
  const dailyForecasts = pointForecast?.dailyForecasts;
  const riseSet = pointForecast?.riseSet;
  const alerts = pointForecast?.alerts;

  return (
    <div className="py-2 bg-neutral-800 text-white text-sm flex flex-col gap-2">
      <div className="flex w-full md:max-w-[600px] mx-auto border-b-2 pb-2 border-white">
        <Button
          className={`w-full rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md ${mode === "text" ? "active" : ""}`}
          onClick={handleTextClick}
        >
          Text Bulletins
        </Button>
        <Button
          className={`w-full rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md ${mode === "point" ? "active" : ""}`}
          onClick={handlePointClick}
        >
          Point Forecast
        </Button>
      </div>
      {mode === "text" && (
        <div className="h-[calc(100dvh-7.1rem)] md:h-[calc(100dvh-7.6rem)] flex flex-col gap-2 overflow-hidden px-2">
          <div className="flex place-items-center border-b-2 border-white pb-2 gap-2 w-full md:max-w-[600px] mx-auto">
            <Label htmlFor="officeSelect">Office:</Label>
            <Select value={office} onValueChange={(e) => setOffice(e as keyof typeof PUBLIC_FORECAST_CONFIG)}>
              <SelectTrigger id="officeSelect" className=" text-black">
                <SelectValue placeholder={productName} />
              </SelectTrigger>
              <SelectContent className="inline-block">
                {Object.keys(PUBLIC_FORECAST_CONFIG).map((office, index) => (
                  <SelectItem key={index} value={office}>
                    {PUBLIC_FORECAST_CONFIG[office as keyof typeof PUBLIC_FORECAST_CONFIG].shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex place-items-center border-b-2 border-white pb-2 gap-2 w-full md:max-w-[600px] mx-auto">
            <Label htmlFor="productSelect">Products:</Label>

            <Select defaultValue={productName} onValueChange={(e) => setBulletin(e as string)}>
              <SelectTrigger id="productSelect" className="text-black">
                <SelectValue placeholder={productName} />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(productList).map((product, index) => (
                  <SelectItem key={index} value={product}>
                    {productList[product as keyof typeof productList]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {productName && bulletinContent && (
            <pre
              className={`overflow-y-scroll whitespace-pre-wrap md:px-6 max-md:pb-12 mx-auto h-[calc(100dvh-14.3rem)] ${fetchStatus === "fetching" ? "text-neutral-500" : ""}`}
            >
              {bulletinContent.trim()}
            </pre>
          )}

          {productName && !bulletinContent && <pre>No Product available</pre>}
        </div>
      )}
      {mode === "point" && (
        <div className="text-center max-md:h-[calc(100dvh-7.1rem)] md:h-[calc(100dvh-7.6rem)] flex flex-col gap-2 w-full md:max-w-[600px] mx-auto overflow-y-auto px-2">
          <PointForecastMap
            searchCoords={searchCoords}
            setSearchCoords={setSearchCoords}
            fetchStatus={pointFetchStatus}
          />

          {error && (
            <div className="text-red-400 w-full flex gap-2 justify-center p-4 bg-neutral-900 rounded-md border border-black">
              <OctagonX /> No forecast data available for the selected location - please try another location.
            </div>
          )}

          {!pointForecast && !error && (
            <div className="w-full flex gap-2 justify-center p-4 bg-neutral-900 rounded-md border border-black">
              <Info /> Centre the map on the location you want to request a forecast for, and then press Search.
            </div>
          )}

          {pointForecast && !error && (
            <div className="flex flex-col gap-2">
              {currentConditions && (
                <div className="flex flex-col border border-black bg-neutral-600 rounded-md">
                  <div className="bg-black rounded-t-md p-2 flex gap-2 justify-between place-items-center">
                    <div className="text-center mx-auto">
                      {currentConditions.siteName ? (
                        <span>{currentConditions.siteName}</span>
                      ) : (
                        <span>No observations available</span>
                      )}
                      {currentConditions.siteId && <span> ({currentConditions.siteId.toUpperCase()})</span>}
                      {currentConditions.siteName && (
                        <span className="text-[0.6rem]"> Valid at {conditionsTimeString}</span>
                      )}
                    </div>

                    <AlertsModal alerts={alerts || []} />
                  </div>
                  <div className="flex flex-col gap-2">
                    {currentConditions.siteName && <CurrentConditions data={currentConditions} />}
                    <NormalsContainer normals={normals} riseSet={riseSet} />
                  </div>
                </div>
              )}

              <div className="border border-black rounded-md">
                <Label className="flex gap-2 justify-center place-items-center font-bold bg-black rounded-t-md p-2">
                  <Calendar /> 7-day Forecast for {pointForecast?.placeName}
                </Label>
                <div className="grid grid-cols-1">
                  {dailyForecasts?.map((period) => {
                    return (
                      <div
                        key={period.id}
                        className="grid grid-cols-5 gap-2 place-items-center text-left  nth-of-type-[2n]:bg-neutral-900 py-4"
                      >
                        <h1 className="text-center w-full ">{period.label}</h1>
                        <div className="col-span-4 flex place-items-center gap-2 w-full border-black">
                          <WxIcon code={parseInt(period.iconCode)} />
                          <div>{period.text}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
