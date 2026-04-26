import { ZOOM_THRESHOLDS } from "@/config/map";
import {
  CAT_COLOURS,
  ICON_SIZES,
  STATION_DENSITY_THRESHOLDS,
  STATION_PRIORITY_CANADA,
  STATION_PRIORITY_MED,
  STATION_PRIORITY_MIN,
  STATION_TEXT_STYLE,
  WINDBARB_COLOURS,
} from "@/config/stationPlots";
import { AWC_ATTRIBUTION } from "@/config/vectorData";
import { useMapLoadingState } from "@/hooks/useMapLoadingState";
import { api } from "@/lib/trpc";
import { checkIfInBounds, filterSpacedPoints, hasValidCoordinates } from "@/lib/utils";
import { useShowObs } from "@/stateStores/map/vectorData";
import { HOUR, MINUTE } from "@shared/lib/constants";
import type { StationPlotGeoJSON } from "@shared/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";

interface Props {
  displayTime: number;
  viewport: [number, number, number, number] | undefined;
  zoom: number;
}

export const Plots = ({ displayTime, viewport, zoom }: Props) => {
  const enabled = useShowObs();

  const { data: plotData, isFetching: plotFetching } = useQuery(
    api.wxmap.wxmapMetars.queryOptions(undefined, {
      enabled,
      refetchInterval: MINUTE,
      trpc: { context: { skipBatch: true } },
    }),
  );

  useMapLoadingState("sfc-plots", plotFetching);

  // construct our station priority list for each zoom level
  // this will give us a computed list of stations to show at each zoom level
  // use the predefined list of must-haves and then use a spatial algorithm to fill in the rest

  const stationPriorityList = useMemo(() => {
    if (!plotData) return { min: [], med: [], global: [] };
    const radius = { min: 180, med: 100, max: 1 };

    const key = "siteId";

    return {
      global: [...STATION_PRIORITY_CANADA, ...filterSpacedPoints(plotData, radius.min, key)],
      min: [...STATION_PRIORITY_MIN, ...filterSpacedPoints(plotData, radius.min, key)],
      med: [...STATION_PRIORITY_MED, ...filterSpacedPoints(plotData, radius.med, key)],
    };
  }, [plotData]);

  // for every site in our list of data, we want to get the metar with the observation that is closest
  // to our display time without being in the future and then collapse its properties into the final output

  const features = plotData?.features.reduce<StationPlotGeoJSON["features"]>((acc, feature) => {
    if (!viewport) return acc;
    const coords = feature.geometry.coordinates;

    // validate the coordinates
    if (!hasValidCoordinates(coords)) return acc;

    // if we are animating, only show stations that are in the current viewport
    if (!checkIfInBounds(coords, viewport)) return acc;

    // apply our zoom-based station density filtering'
    if (zoom < STATION_DENSITY_THRESHOLDS.global) {
      if (!stationPriorityList.global.includes(feature.properties.siteId)) return acc;
    } else if (zoom < STATION_DENSITY_THRESHOLDS.min) {
      if (!stationPriorityList.min.includes(feature.properties.siteId)) return acc;
    } else if (zoom >= STATION_DENSITY_THRESHOLDS.min && zoom < STATION_DENSITY_THRESHOLDS.max) {
      if (!stationPriorityList.med.includes(feature.properties.siteId)) return acc;
    }

    const metar = feature.properties.metars
      .sort((a, b) => {
        const aDiff = displayTime - new Date(a.validTime).getTime();
        const bDiff = displayTime - new Date(b.validTime).getTime();
        return aDiff - bDiff;
      })
      .find(
        (m) =>
          new Date(m.validTime).getTime() <= displayTime && new Date(m.validTime).getTime() >= displayTime - 2 * HOUR,
      );

    if (metar) {
      acc.push({
        type: "Feature",
        geometry: feature.geometry,
        properties: {
          ...metar,
          siteId: feature.properties.siteId,
        },
      });
    }

    return acc;
  }, []);

  const filteredPlots: StationPlotGeoJSON = {
    type: "FeatureCollection",
    features: features || [],
  };

  if (!enabled) return null;

  return (
    <>
      {/* Clustered source for text that can be culled when too dense */}
      <Source attribution={AWC_ATTRIBUTION} id="plot-data" key="plot-data" type="geojson" data={filteredPlots}>
        {/* Wind barbs */}
        <Layer
          id="layer-sfc-obs-windbarb"
          type="symbol"
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
          minzoom={ZOOM_THRESHOLDS.reduced}
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
          minzoom={ZOOM_THRESHOLDS.reduced}
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
          minzoom={ZOOM_THRESHOLDS.medium}
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
          minzoom={ZOOM_THRESHOLDS.medium}
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
          minzoom={ZOOM_THRESHOLDS.medium}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "validTimeString"],
            "text-offset": [0, 3],
            "text-size": 10,
          }}
        />

        {/* Weather and visibility labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-wx"
          minzoom={ZOOM_THRESHOLDS.reduced}
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
