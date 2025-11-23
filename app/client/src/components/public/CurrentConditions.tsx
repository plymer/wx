import { AqhiContainer } from "./current/AqhiContainer";
import { TemperatureContainer } from "./current/TemperatureContainer";
import { WindContainer } from "./current/WindContainer";
import { WxContainer } from "./current/WxContainer";

interface Props {
  data: {
    siteId: string;
    siteName: string;
    time: string;
    iconCode: string;
    weather: {
      condition: string;
      tt: string;
      td: string;
      vis: string;
      mslp: string;
      humidity: string;
      wSpd: string;
      wDir: string;
      wGust: string;
    };
    aqhi: {
      value: number;
      time: number;
      text?: string | undefined;
    };
  };
}

export const CurrentConditions = ({ data }: Props) => {
  return (
    <div className="grid grid-cols-4 gap-2 place-items-center pt-2 px-4">
      <WxContainer condition={data.weather.condition} iconCode={data.iconCode} />
      <TemperatureContainer tt={data.weather.tt} td={data.weather.td} />
      <WindContainer direction={data.weather.wDir} speed={data.weather.wSpd} gust={data.weather.wGust} />
      <AqhiContainer aqhi={data.aqhi} />
    </div>
  );
};
