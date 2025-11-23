import { useBulletin, useCoords, useMode, useOffice, usePublicActions } from "@/stateStores/public";

import { PUBLIC_FORECAST_CONFIG } from "../config/public";
import { api } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import { useQuery } from "@tanstack/react-query";
import { MINUTE } from "@shared/lib/constants";
import Button from "./ui/Button";
import { Label } from "./ui/Label";
import {
  AlertTriangle,
  Calendar,
  Cloud,
  CloudDrizzle,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudMoonRain,
  CloudOff,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  CloudSunRain,
  FlameKindling,
  Moon,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Sun,
  Sunrise,
  Sunset,
  SunSnow,
  Thermometer,
  ThermometerSnowflake,
  ThermometerSun,
  Tornado,
  Wind,
  WindArrowDown,
} from "lucide-react";
import { PointForecastMap } from "./public/PointForecastMap";
import type { Position } from "geojson";
import { AlertsModal } from "./public/AlertsModal";
import { WindContainer } from "./public/current/WindContainer";

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
  const aqhi = currentConditions?.aqhi;
  const normals = pointForecast?.normals;
  const dailyForecasts = pointForecast?.dailyForecasts;
  const riseSet = pointForecast?.riseSet;
  const alerts = pointForecast?.alerts;

  return (
    <div className="p-2 bg-neutral-800 text-white text-sm flex flex-col gap-2">
      <div className="flex gap-4 w-full md:max-w-[600px] mx-auto border-b-2 pb-2 border-white">
        <Button className={`w-full ${mode === "text" ? "active" : ""}`} onClick={handleTextClick}>
          Text Bulletins
        </Button>
        <Button className={`w-full ${mode === "point" ? "active" : ""}`} onClick={handlePointClick}>
          Point Forecast
        </Button>
      </div>
      {mode === "text" && (
        <div className="h-[calc(100dvh-7.1rem)] md:h-[calc(100dvh-7.6rem)] flex flex-col gap-2 overflow-hidden">
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
        <div className="text-center max-md:h-[calc(100dvh-7.1rem)] md:h-[calc(100dvh-7.6rem)] flex flex-col gap-2 w-full md:max-w-[600px] mx-auto overflow-y-auto">
          <PointForecastMap setSearchCoords={setSearchCoords} fetchStatus={pointFetchStatus} />

          {error && <div className="text-red-500 w-full">Error fetching point forecast data. Please try again.</div>}

          {!pointForecast && !error && (
            <div className="w-full p-4 bg-neutral-600 rounded-md border border-black">
              Centre the map on the location you want to request a forecast for, and then press Search.
            </div>
          )}

          {pointForecast && !error && (
            <div className="flex flex-col gap-2">
              {currentConditions && (
                <div className="flex flex-col gap-2 border border-black bg-neutral-600 rounded-md">
                  <div className="bg-black rounded-t-md p-2 flex gap-2 justify-between place-items-center">
                    <div className="text-center mx-auto">
                      <span>{currentConditions.siteName}</span>
                      {currentConditions.siteId && <span> ({currentConditions.siteId.toUpperCase()})</span>}
                      <span className="text-[0.6rem]"> Valid at {conditionsTimeString}</span>
                    </div>
                    <div>
                      <AlertsModal alerts={alerts || []} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-4 gap-2 place-items-center px-4">
                      <div className="flex gap-2 place-items-center">
                        <div>
                          {currentConditions.weather.condition ? (
                            <WxOfficeCodeToIcon code={parseInt(currentConditions.iconCode)} />
                          ) : (
                            <CloudOff />
                          )}
                        </div>
                        <div>
                          {currentConditions.weather.condition
                            ? `${currentConditions.weather.condition}`
                            : "no wx available"}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 place-items-center text-left">
                        <Thermometer className="ms-auto" />
                        <div className="text-right">
                          <div>{currentConditions.weather.tt}&deg;C</div>
                          <div>{currentConditions.weather.td}&deg;C</div>
                        </div>
                      </div>
                      <WindContainer
                        direction={currentConditions.weather.wDir}
                        speed={currentConditions.weather.wSpd}
                        gust={currentConditions.weather.wGust}
                      />
                      {aqhi && aqhi.time ? (
                        <div className="flex gap-2 place-items-center">
                          <FlameKindling />
                          <div>
                            <div className="flex gap-2 place-items-center">
                              <AQHIIcon value={aqhi.value} />
                              <div>{aqhi.value}</div>
                            </div>
                            <div className="text-xs italic">
                              {new Date(aqhi.time * 1000).toISOString().replace("T", " ").slice(-13, -8) + "Z"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>No AQHI data available</div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 place-items-center border-t border-black bg-neutral-600 py-2 rounded-b-md">
                      <div className="grid grid-cols-3 place-items-center gap-2">
                        <h1>Normal</h1>
                        <div className="flex gap-2 place-items-center">
                          <ThermometerSun />
                          <div className="w-8 text-right">{normals?.high}&deg;C</div>
                        </div>
                        <div className="flex gap-2 place-items-center">
                          <ThermometerSnowflake />
                          <div className="w-8 text-right">{normals?.low}&deg;C</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Sunrise /> {riseSet?.rise}
                        <Sunset /> {riseSet?.set}
                      </div>
                    </div>
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
                        className="grid grid-cols-5 gap-2 place-items-center text-left  nth-of-type-[2n]:bg-neutral-900 pe-2 py-4"
                      >
                        <h1 className="text-center w-full border-e border-black">{period.label}</h1>
                        <div className="col-span-4 text-left w-full">{period.text}</div>
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

const WxOfficeCodeToIcon = ({ code }: { code: number }) => {
  switch (code) {
    case 0:
      return <Sun />;
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
      return <CloudSun />;
    case 6:
    case 7:
    case 8:
      return <CloudSunRain />;
    case 10:
      return <Cloud />;
    case 11:
    case 28:
      <CloudDrizzle />;
    case 13:
    case 12:
      return <CloudRain />;
    case 14:
    case 27:
      return <CloudHail />;
    case 15:
      return <CloudRainWind />;
    case 16:
    case 17:
    case 18:
      return <CloudSnow />;
    case 9:
    case 19:
    case 39:
    case 46:
    case 47:
      return <CloudLightning />;
    case 20:
    case 21:
    case 23:
    case 24:
    case 31:
    case 32:
    case 33:
    case 34:
    case 35:
      return <CloudMoon />;
    case 22:
      return <CloudSun />;
    case 25:
    case 40:
    case 43:
    case 45:
      return <WindArrowDown />;
    case 26:
      return <SunSnow />;
    case 30:
      return <Moon />;
    case 36:
    case 37:
    case 38:
      return <CloudMoonRain />;
    case 41:
    case 42:
    case 48:
      return <Tornado />;
    case 44:
      return <FlameKindling />;
    default:
      return <div>{code} (missing icon)</div>;
  }
};

const AQHIIcon = ({ value }: { value: number }) => {
  if (value <= 3) {
    // low
    return <SignalLow />;
  } else if (value <= 6) {
    // moderate
    return <SignalMedium />;
  } else if (value <= 10) {
    // high
    return <SignalHigh />;
  } else {
    // very high
    return <Signal />;
  }
};
