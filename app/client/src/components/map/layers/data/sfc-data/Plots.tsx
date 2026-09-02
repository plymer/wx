import { ZOOM_THRESHOLDS } from "@/config/map";
import { CAT_COLOURS, ICON_SIZES, STATION_TEXT_STYLE, WINDBARB_COLOURS } from "@/config/stationPlots";

import { useShowObs } from "@/stateStores/map/vectorData";
import type { FilterSpecification } from "maplibre-gl";
import { Layer } from "react-map-gl/maplibre";

interface Props {
  displayTime: number;
}

export const Plots = ({ displayTime }: Props) => {
  const enabled = useShowObs();

  const filter: FilterSpecification = [
    "all",
    ["<=", ["get", "start_time"], ["to-number", displayTime]],
    [">", ["get", "expiry_time"], ["to-number", displayTime]],
  ];

  if (!enabled) return null;

  return (
    <>
      {/* Wind barbs */}
      <Layer
        id="layer-sfc-obs-windbarb"
        type="symbol"
        source="vector-tile-source"
        source-layer="metars"
        filter={filter}
        minzoom={ZOOM_THRESHOLDS.mini}
        layout={{
          "icon-allow-overlap": true,
          "icon-image": [
            "concat",
            "windbarbs:wind-",
            ["number-format", ["get", "wind_spd"], { "min-fraction-digits": 0, "max-fraction-digits": 0 }],
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
          "icon-rotate": ["get", "wind_dir"],
        }}
        paint={{
          "icon-halo-color": "#000",
          "icon-halo-width": 2,
          "icon-color": [
            "step",
            ["get", "wind_spd"],
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
        source="vector-tile-source"
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
          "symbol-sort-key": ["get", "station_priority"],
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
        source="vector-tile-source"
        source-layer="metars"
        minzoom={ZOOM_THRESHOLDS.reduced}
        filter={filter}
        layout={{
          ...STATION_TEXT_STYLE.layout,
          "text-field": ["get", "wind_gst"],
          "text-anchor": "center",
          "text-offset": [0, 0],
        }}
      />
      {/* Site ID labels */}
      <Layer
        {...STATION_TEXT_STYLE}
        id="layer-sfc-obs-id"
        source="vector-tile-source"
        source-layer="metars"
        minzoom={ZOOM_THRESHOLDS.reduced}
        filter={filter}
        layout={{
          ...STATION_TEXT_STYLE.layout,
          "text-field": ["get", "site_id"],
          "text-offset": [1.5, 1.5],
        }}
      />

      {/* Temperature labels */}
      <Layer
        {...STATION_TEXT_STYLE}
        id="layer-sfc-obs-tt"
        source="vector-tile-source"
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
        source="vector-tile-source"
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
        source="vector-tile-source"
        source-layer="metars"
        minzoom={ZOOM_THRESHOLDS.medium}
        filter={filter}
        layout={{
          ...STATION_TEXT_STYLE.layout,
          "text-field": ["get", "time_string"],
          "text-offset": [0, 3],
          "text-size": 10,
        }}
      />

      {/* Weather and visibility labels */}
      <Layer
        {...STATION_TEXT_STYLE}
        id="layer-sfc-obs-wx"
        source="vector-tile-source"
        source-layer="metars"
        minzoom={ZOOM_THRESHOLDS.reduced}
        filter={filter}
        layout={{
          ...STATION_TEXT_STYLE.layout,
          "text-field": ["concat", ["get", "vis"], " ", ["get", "wx_string"]],
          "text-offset": [-1.5, 0],
          "text-anchor": "right",
        }}
      />
    </>
  );
};
