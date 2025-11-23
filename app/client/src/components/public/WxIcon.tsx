import {
  Cloud,
  CloudDrizzle,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudMoonRain,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  CloudSunRain,
  FlameKindling,
  Moon,
  Sun,
  SunSnow,
  Tornado,
  WindArrowDown,
} from "lucide-react";

export const WxIcon = ({ code }: { code: number }) => {
  switch (code) {
    case 0:
      return <Sun className="shrink-0" />;
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
      return <CloudSun className="shrink-0" />;
    case 6:
    case 7:
    case 8:
      return <CloudSunRain className="shrink-0" />;
    case 10:
      return <Cloud className="shrink-0" />;
    case 11:
    case 28:
      <CloudDrizzle className="shrink-0" />;
    case 13:
    case 12:
      return <CloudRain className="shrink-0" />;
    case 14:
    case 27:
      return <CloudHail className="shrink-0" />;
    case 15:
      return <CloudRainWind className="shrink-0" />;
    case 16:
    case 17:
    case 18:
      return <CloudSnow className="shrink-0" />;
    case 9:
    case 19:
    case 39:
    case 46:
    case 47:
      return <CloudLightning className="shrink-0" />;
    case 20:
    case 21:
    case 23:
    case 24:
    case 31:
    case 32:
    case 33:
    case 34:
    case 35:
      return <CloudMoon className="shrink-0" />;
    case 22:
      return <CloudSun className="shrink-0" />;
    case 25:
    case 40:
    case 43:
    case 45:
      return <WindArrowDown className="shrink-0" />;
    case 26:
      return <SunSnow className="shrink-0" />;
    case 30:
      return <Moon className="shrink-0" />;
    case 36:
    case 37:
    case 38:
      return <CloudMoonRain className="shrink-0" />;
    case 41:
    case 42:
    case 48:
      return <Tornado className="shrink-0" />;
    case 44:
      return <FlameKindling className="shrink-0" />;
    default:
      return <div>{code} (missing icon)</div>;
  }
};
