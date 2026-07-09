import { ZOOM_THRESHOLDS } from "@/config/map";
import { CAT_COLOURS, ICON_SIZES, STATION_TEXT_STYLE, WINDBARB_COLOURS } from "@/config/stationPlots";
import { AWC_ATTRIBUTION } from "@/config/vectorData";

import { useTileUrl } from "@/hooks/useTileUrl";

import { useShowObs } from "@/stateStores/map/vectorData";
import type { FilterSpecification } from "maplibre-gl";
import { Layer, Source } from "react-map-gl/maplibre";

interface Props {
  displayTime: number;
}

export const Plots = ({ displayTime }: Props) => {
  const enabled = useShowObs();

  const tileUrl = useTileUrl();

  const filter: FilterSpecification = [
    "all",
    ["<=", ["get", "startTime"], ["to-number", displayTime]],
    [">", ["get", "expiryTime"], ["to-number", displayTime]],
  ];

  if (!enabled) return null;

  return (
    <>
      {/* Clustered source for text that can be culled when too dense */}
      <Source attribution={AWC_ATTRIBUTION} id="plot-data" key="plot-data" type="vector" tiles={[tileUrl]}>
        {/* Wind barbs */}
        <Layer
          id="layer-sfc-obs-windbarb"
          type="symbol"
          source-layer="metars"
          filter={filter}
          minzoom={ZOOM_THRESHOLDS.mini}
          layout={{
            "icon-allow-overlap": true,
            "icon-image": [
              "concat",
              "windbarbs:wind-",
              ["number-format", ["get", "windSpd"], { "min-fraction-digits": 0, "max-fraction-digits": 0 }],
            ],
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              ZOOM_THRESHOLDS.mini,
              ICON_SIZES.mini.windbarb,
              ZOOM_THRESHOLDS.reduced,
              ICON_SIZES.reduced.windbarb,
              ZOOM_THRESHOLDS.maximum,
              ICON_SIZES.maximum.windbarb,
            ],
            "icon-rotate": ["get", "windDir"],
          }}
          paint={{
            "icon-halo-color": "#000",
            "icon-halo-width": 2,
            "icon-color": [
              "step",
              ["get", "windSpd"],
              "white",
              20,
              WINDBARB_COLOURS[20],
              30,
              WINDBARB_COLOURS[30],
              40,
              WINDBARB_COLOURS[40],
              50,
              WINDBARB_COLOURS[50],
            ],
          }}
        />

        {/* Station dots */}
        <Layer
          id="layer-sfc-obs-dot"
          type="symbol"
          source-layer="metars"
          filter={filter}
          layout={{
            "icon-allow-overlap": true,
            "icon-image": "icons:stn-hwos",
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              ZOOM_THRESHOLDS.mini,
              ICON_SIZES.mini.station,
              ZOOM_THRESHOLDS.reduced,
              ICON_SIZES.reduced.station,
              ZOOM_THRESHOLDS.maximum,
              ICON_SIZES.maximum.station,
            ],
            "symbol-sort-key": ["get", "stationPriority"],
          }}
          paint={{
            "icon-color": [
              "match",
              ["get", "category"],
              "VFR",
              CAT_COLOURS.vfr,
              "MVFR",
              CAT_COLOURS.mvfr,
              "IFR",
              CAT_COLOURS.ifr,
              "LIFR",
              CAT_COLOURS.lifr,
              CAT_COLOURS.none,
            ],
            "icon-halo-color": "#000",
            "icon-halo-width": 2,
            "icon-halo-blur": 0,
          }}
        />

        {/* Wind gust labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-gust"
          source-layer="metars"
          minzoom={ZOOM_THRESHOLDS.reduced}
          filter={filter}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "windGst"],
            "text-anchor": "center",
            "text-offset": [0, 0],
          }}
        />
        {/* Site ID labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-id"
          source-layer="metars"
          minzoom={ZOOM_THRESHOLDS.reduced}
          filter={filter}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "siteId"],
            "text-offset": [1.5, 1.5],
          }}
        />

        {/* Temperature labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-tt"
          source-layer="metars"
          minzoom={ZOOM_THRESHOLDS.medium}
          filter={filter}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "tt"],
            "text-offset": [-1.5, -1.5],
            "text-size": 10,
          }}
        />

        {/* Dew point labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-td"
          source-layer="metars"
          minzoom={ZOOM_THRESHOLDS.medium}
          filter={filter}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "td"],
            "text-offset": [-1.5, 1.5],
            "text-size": 10,
          }}
        />

        {/* Valid Time */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-valid-time"
          source-layer="metars"
          minzoom={ZOOM_THRESHOLDS.medium}
          filter={filter}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "timeString"],
            "text-offset": [0, 3],
            "text-size": 10,
          }}
        />

        {/* Weather and visibility labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-wx"
          source-layer="metars"
          minzoom={ZOOM_THRESHOLDS.reduced}
          filter={filter}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["concat", ["get", "vis"], " ", ["get", "wxString"]],
            "text-offset": [-1.5, 0],
            "text-anchor": "right",
          }}
        />
      </Source>
    </>
  );
};
