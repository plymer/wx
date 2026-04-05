import { Layer, Source } from "react-map-gl/maplibre";
import { useDisplayTime } from "@/hooks/useDisplayTime";

import type { StationPlotGeoJSON } from "@shared/lib/types";

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
import { AWC_ATTRIBUTION, UNCLUSTERED } from "@/config/vectorData";

import { useMapStateActions, useViewportBounds, useZoom } from "@/stateStores/map/mapView";
import { useShowObs } from "@/stateStores/map/vectorData";

import { HOUR, MINUTE } from "@shared/lib/constants";
import { checkIfInBounds, filterSpacedPoints, hasValidCoordinates } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";

import { useFrame } from "@/stateStores/map/animation";

export const SurfaceDataLayer = () => {
  const zoom = useZoom();
  const enabled = useShowObs();
  const viewport = useViewportBounds();
  const currentFrame = useFrame();
  const { setLoadingState } = useMapStateActions();

  const displayTime = useDisplayTime();

  const { data: plotData, fetchStatus: plotDataFetch } = useQuery(
    api.wxmap.wxmapMetars.queryOptions(undefined, {
      enabled,
      refetchInterval: MINUTE,
      trpc: { context: { skipBatch: true } },
    }),
  );

  const { data: popupData } = useQuery(
    api.wxmap.wxmapPopupData.queryOptions(undefined, {
      enabled,
      trpc: { context: { skipBatch: true } },
    }),
  );

  const { data: isobarData } = useQuery(
    api.wxmap.wxmapIsobars.queryOptions(undefined, {
      enabled,
      refetchInterval: 5 * MINUTE,
      trpc: { context: { skipBatch: true } },
    }),
  );

  useEffect(() => {
    if (plotDataFetch === "fetching") setLoadingState(true);
    else setLoadingState(false);
  }, [plotDataFetch]);

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
        const aDiff = displayTime - a.validTime.getTime();
        const bDiff = displayTime - b.validTime.getTime();
        return aDiff - bDiff;
      })
      .find((m) => m.validTime.getTime() <= displayTime && m.validTime.getTime() >= displayTime - 2 * HOUR);

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

  const interpolatedData = useMemo(() => isobarData?.[currentFrame], [isobarData, currentFrame]);

  if (!enabled) return;

  return (
    <>
      <Source
        id="sfc-obs-interpolated"
        type="geojson"
        data={interpolatedData ?? { type: "FeatureCollection", features: [] }}
      >
        <Layer
          id="layer-sfc-obs-mslp-isolines"
          type="line"
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
          paint={{
            "line-color": "#111",
            "line-width": 3,
          }}
        />
        <Layer
          id="layer-sfc-obs-mslp-isolines-labels"
          type="symbol"
          layout={{
            "symbol-placement": "line",
            "symbol-spacing": 400,
            "text-field": ["concat", ["to-string", ["round", ["get", "value"]]], " hPa"],
            "text-font": ["Consolas-Regular"],
            "text-size": 16,
            "text-keep-upright": true,
          }}
          paint={{
            "text-color": "#000",
            "text-halo-color": "#fff",
            "text-halo-width": 1.5,
          }}
        />
        <Layer
          id="layer-sfc-obs-mslp-extrema-value"
          type="symbol"
          filter={["has", "kind"]}
          layout={{
            "text-field": ["get", "value"],
            "text-allow-overlap": true,
            "text-anchor": "center",
          }}
          paint={{ "text-color": "#000", "text-halo-color": "#fff", "text-halo-width": 2 }}
        />
        <Layer
          id="layer-sfc-obs-mslp-extrema-marker"
          type="symbol"
          filter={["has", "kind"]}
          layout={{
            "text-field": ["match", ["get", "kind"], "max", "H", "min", "L", ""],
            "text-allow-overlap": true,
            "text-anchor": "bottom",
            "text-size": 48,
            "text-font": ["Open-Sans-Italic"],
          }}
          paint={{ "text-color": "#000", "text-halo-color": "#fff", "text-halo-width": 2 }}
        />
      </Source>
      {/* Clustered source for text that can be culled when too dense */}
      <Source
        attribution={AWC_ATTRIBUTION}
        id="cullable-plot-data"
        key="cullable-plot-data"
        type="geojson"
        data={filteredPlots}
        cluster={true}
        clusterRadius={20}
        clusterMaxZoom={14}
      >
        {/* Site ID labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-id"
          filter={UNCLUSTERED}
          minzoom={ZOOM_THRESHOLDS.reduced}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "siteId"],
            "text-offset": [1.5, 1.5],
          }}
        />

        {/* Wind gust labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-gust"
          beforeId="layer-sfc-obs-id"
          minzoom={ZOOM_THRESHOLDS.reduced}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "windGst"],
            "text-anchor": "center",
            "text-offset": [0, 0],
          }}
        />

        {/* Temperature labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-tt"
          filter={UNCLUSTERED}
          minzoom={ZOOM_THRESHOLDS.reduced}
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
          filter={UNCLUSTERED}
          minzoom={ZOOM_THRESHOLDS.reduced}
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
          filter={UNCLUSTERED}
          minzoom={ZOOM_THRESHOLDS.reduced}
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
          filter={UNCLUSTERED}
          minzoom={ZOOM_THRESHOLDS.reduced}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["concat", ["get", "vis"], " ", ["get", "wxString"]],
            "text-offset": [-1.5, 0],
            "text-anchor": "right",
          }}
        />
      </Source>

      {/* Non-clustered source for persistent elements */}
      <Source
        attribution={AWC_ATTRIBUTION}
        id="persistent-sfc-data"
        key="persistent-sfc-data"
        type="geojson"
        data={filteredPlots}
      >
        {/* Station dots */}
        <Layer
          beforeId="layer-sfc-obs-gust"
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

        {/* Wind barbs */}
        <Layer
          beforeId="layer-sfc-obs-dot"
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
      </Source>
      <Source
        id="sfc-obs-interactive-target"
        type="geojson"
        data={popupData || { type: "FeatureCollection", features: [] }}
      >
        {/* Interactive target (invisible circles for click detection) */}
        <Layer
          id="layer-sfc-obs-target"
          type="circle"
          paint={{
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              ZOOM_THRESHOLDS.mini,
              zoom * 3, // was 1.5
              ZOOM_THRESHOLDS.reduced,
              12, // was 8
              ZOOM_THRESHOLDS.maximum,
              20, // was 10
            ],
            "circle-opacity": 0,
          }}
        />
        <Layer
          id="layer-sfc-obs-target-cross"
          beforeId="layer-sfc-obs-windbarb"
          type="symbol"
          paint={{
            "text-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              ZOOM_THRESHOLDS.mini + 1,
              0,
              ZOOM_THRESHOLDS.reduced,
              1,
            ],
          }}
          layout={{
            "text-field": "+",
            "text-allow-overlap": true,
          }}
        />
      </Source>
    </>
  );
};
