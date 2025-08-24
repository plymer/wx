import { useMemo, useState } from "react";
import { Source, Layer, useMap } from "react-map-gl/maplibre";
import { FeatureCollection } from "geojson";

import { useWxAPI } from "../../../hooks/useWxAPI";
import useMergePayload from "../../../hooks/useMergePayload";
import { JSONData, MetarGeoJSON, StationPlotFeature } from "../../../lib/types";
import { calculateCeiling, calculateFlightCategory, checkIfInBounds, getObType } from "../../../lib/utils";
import { ZOOM_THRESHOLDS } from "../../../config/map";
import {
  CAT_COLOURS,
  ICON_SIZES,
  STATION_DENSITY_THRESHOLDS,
  STATION_PRIORITY_MIN,
  STATION_PRIORITY_MED,
  STATION_TEXT_STYLE,
  WINDBARB_COLOURS,
} from "../../../config/stationPlots";
import { useShowObs } from "../../../stateStores/vectorData";
import { useSiteId } from "../../../stateStores/alphaData";
import { useDeltaTime, useFrame, useStartTime, useAnimationState } from "../../../stateStores/animation";
import { useViewportBounds, useZoom } from "../../../stateStores/mapView";
import { NOT_CLUSTERED } from "../../../config/vectorData";

/**
 * Self-contained Station Plot Layer with complete data fetching and rendering logic.
 * Shows surface weather observations with wind barbs, flight categories, and detailed meteorological data.
 */
export function StationPlotLayer() {
  // Get visibility from state store
  const showObs = useShowObs();

  // Get animation state for temporal filtering
  const deltaTime = useDeltaTime();
  const frame = useFrame();
  const startTime = useStartTime();
  const currentTime = deltaTime * frame + startTime;
  const isPlaying = useAnimationState() === "playing";

  // Get map state
  const bounds = useViewportBounds();
  const zoom = useZoom();

  // Get alpha data state for highlighting selected site
  const currentSiteId = useSiteId();

  // Get map reference - must be called before any conditional returns
  const map = useMap().current;

  // Local state for incremental data updates
  const [newestMetar, setNewestMetar] = useState<number | undefined>(undefined);
  const [metarData, setMetarData] = useState<MetarGeoJSON | undefined>(undefined);

  // Define query parameters based on newestMetar state
  const metarQueryParams = useMemo(() => {
    return !newestMetar
      ? { type: "metar" } // this is for the first request
      : { format: "geojson", minId: newestMetar }; // this is for the incremental updates
  }, [newestMetar]);

  const metarEndpoint = useMemo(() => {
    return !newestMetar ? "/payloads" : "/alpha/metars";
  }, [newestMetar]);

  // Fetch METAR data - only enabled in realtime mode when layer is visible
  const {
    data: metars,
    isLoading: metarsLoading,
    error: metarsError,
  } = useWxAPI<MetarGeoJSON>(metarEndpoint, metarQueryParams, {
    enabled: showObs,
    interval: 1,
    queryName: "allMetars",
  });

  // Fetch TAF data
  const {
    data: tafs,
    isLoading: tafsLoading,
    error: tafsError,
  } = useWxAPI<JSONData>(
    "/alpha/tafs",
    { format: "json", hours: 12 },
    {
      enabled: showObs,
      interval: 1,
      queryName: "allTafs",
    },
  );

  // Automatically merge new metar data with existing data, and cull outdated observations
  useMergePayload<MetarGeoJSON>({
    dataType: "metar",
    newData: metars,
    currentData: metarData,
    dataSetter: setMetarData,
    idSetter: setNewestMetar,
    currentMaxId: newestMetar,
    startTime,
  });

  // Early return if the layer is not ready to be rendered
  if (!showObs || !map || metarsLoading || tafsLoading) return null;

  if (metarsError || tafsError) {
    console.error("Station plot data error:", metarsError || tafsError);
    return null;
  }

  const tafData = tafs?.status === "success" && tafs.data;

  // Process station data for display
  const stationData: FeatureCollection = {
    type: "FeatureCollection",
    features: metarData
      ? metarData.features.reduce((acc: StationPlotFeature[], feature) => {
          const isInBounds = isPlaying && bounds ? checkIfInBounds(feature.geometry.coordinates, bounds) : true;

          if (!isInBounds) return acc;

          // apply our zoom-based station density filtering
          if (zoom < STATION_DENSITY_THRESHOLDS.min) {
            if (!STATION_PRIORITY_MIN.includes(feature.properties.site)) return acc;
          } else if (zoom >= STATION_DENSITY_THRESHOLDS.min && zoom < STATION_DENSITY_THRESHOLDS.max) {
            if (!STATION_PRIORITY_MED.includes(feature.properties.site)) return acc;
          }

          if (feature.properties.obsParsed.length === 0 || !feature.geometry) return acc;

          const closestTimeStep = feature.properties.obsParsed.reduce((prev, curr) => {
            const prevDiff = Math.abs(prev.validTime - currentTime);
            const currDiff = Math.abs(curr.validTime - currentTime);
            return prevDiff < currDiff ? prev : curr;
          });

          // Get the corresponding raw observation index
          const timeStepIndex = feature.properties.obsParsed.indexOf(closestTimeStep);
          const obType = getObType(feature.properties.obsRaw[timeStepIndex]);
          const ceiling = calculateCeiling(closestTimeStep.clouds);
          const category = calculateFlightCategory(closestTimeStep.vis, ceiling);
          const metars = feature.properties.obsRaw.map((raw: string) => raw);
          const taf =
            tafData && tafData[feature.properties.site]
              ? tafData[feature.properties.site][tafData[feature.properties.site].length - 1]
              : undefined;

          acc.push({
            ...feature,
            properties: {
              siteId: feature.properties.site,
              name: feature.properties.name,
              lat: feature.geometry.coordinates[1],
              lon: feature.geometry.coordinates[0],
              validTime: closestTimeStep.validTime,
              type: obType,
              tt: closestTimeStep.tt,
              td: closestTimeStep.td,
              spread: closestTimeStep.tt - closestTimeStep.td,
              altimeter: closestTimeStep.altimeter,
              mslp: closestTimeStep.mslp,
              windDir: closestTimeStep.wind.dir,
              windSpd: closestTimeStep.wind.speed,
              windGst: closestTimeStep.wind.gust,
              wx: closestTimeStep.wx,
              vis: closestTimeStep.vis,
              ceiling: ceiling,
              cat: category,
              metars: metars,
              taf: taf,
              dataType: "site",
            },
          });

          return acc;
        }, [])
      : [],
  };

  const selectedStation = currentSiteId
    ? stationData.features.find((s) => s.properties?.siteId === currentSiteId)
    : undefined;

  // Render the layers
  return (
    <>
      {/* Clustered source for text that can be culled when too dense */}
      <Source
        id="cullable-plot-data"
        key="cullable-plot-data"
        type="geojson"
        data={stationData}
        cluster={true}
        clusterRadius={20}
        clusterMaxZoom={14}
      >
        {/* Site ID labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-id"
          filter={NOT_CLUSTERED}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "siteId"],
            "text-offset": [1.5, 1.5],
            visibility: zoom > ZOOM_THRESHOLDS.reduced ? "visible" : "none",
          }}
        />

        {/* Wind gust labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-gust"
          beforeId="layer-sfc-obs-id"
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "windGst"],
            "text-anchor": "center",
            "text-offset": [0, 0],
            visibility: zoom > ZOOM_THRESHOLDS.reduced ? "visible" : "none",
          }}
        />

        {/* Temperature labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-tt"
          filter={NOT_CLUSTERED}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "tt"],
            "text-offset": [-1.5, -1.5],
            visibility: zoom > ZOOM_THRESHOLDS.maximum ? "visible" : "none",
          }}
        />

        {/* Dew point labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-td"
          filter={NOT_CLUSTERED}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "td"],
            "text-offset": [-1.5, 1.5],
            visibility: zoom > ZOOM_THRESHOLDS.maximum ? "visible" : "none",
          }}
        />

        {/* Temperature-dew point spread labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-spread"
          filter={NOT_CLUSTERED}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["number-format", ["get", "spread"], { "min-fraction-digits": 0, "max-fraction-digits": 0 }],
            "text-offset": [0, -3],
            "text-allow-overlap": false,
            visibility: zoom > ZOOM_THRESHOLDS.maximum ? "visible" : "none",
          }}
        />

        {/* Weather and visibility labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-wx"
          filter={NOT_CLUSTERED}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["concat", ["get", "vis"], " ", ["get", "wx"]],
            "text-offset": [-1.5, 0],
            "text-anchor": "right",
            visibility: zoom > ZOOM_THRESHOLDS.reduced ? "visible" : "none",
          }}
        />

        {/* Altimeter labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-alt"
          filter={NOT_CLUSTERED}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "altimeter"],
            "text-allow-overlap": false,
            "text-anchor": "left",
            "text-offset": [1.5, -1.5],
            visibility: zoom > ZOOM_THRESHOLDS.maximum ? "visible" : "none",
          }}
        />

        {/* MSLP labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-mslp"
          filter={NOT_CLUSTERED}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "mslp"],
            "text-allow-overlap": false,
            "text-anchor": "left",
            "text-offset": [1.5, 0],
            visibility: zoom > ZOOM_THRESHOLDS.maximum ? "visible" : "none",
          }}
        />
      </Source>

      {/* Non-clustered source for persistent elements */}
      <Source id="persistent-sfc-plots" key="persistent-sfc-plots" type="geojson" data={stationData}>
        {/* Station dots */}
        <Layer
          beforeId="layer-sfc-obs-gust"
          id="layer-sfc-obs-dot"
          type="symbol"
          layout={{
            "icon-allow-overlap": true,
            "icon-image": ["match", ["get", "type"], "AUTO", "icons:stn-auto", "icons:stn-hwos"],
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
          }}
          paint={{
            "icon-color": [
              "match",
              ["get", "cat"],
              "vfr",
              CAT_COLOURS.vfr,
              "mvfr",
              CAT_COLOURS.mvfr,
              "ifr",
              CAT_COLOURS.ifr,
              "lifr",
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
            visibility: zoom > ZOOM_THRESHOLDS.mini ? "visible" : "none",
          }}
          paint={{
            "icon-halo-color": "#000",
            "icon-halo-width": 1,
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
      </Source>
      <Source
        id="selected-station"
        type="geojson"
        data={{ type: "FeatureCollection", features: selectedStation ? [selectedStation] : [] }}
      >
        <Layer
          source="selected-station"
          id="layer-sfc-obs-selected-station"
          beforeId="layer-sfc-obs-windbarb"
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
            "circle-color": "#ff00ff",
          }}
        />
      </Source>
    </>
  );
}
