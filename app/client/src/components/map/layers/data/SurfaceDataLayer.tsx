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
import { UNCLUSTERED } from "@/config/vectorData";

import { useViewportBounds, useZoom } from "@/stateStores/map/mapView";
import { useShowObs } from "@/stateStores/map/vectorData";

import { HOUR, MINUTE } from "@shared/lib/constants";
import { checkIfInBounds, filterSpacedPoints, hasValidCoordinates } from "@/lib/utils";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";

export const SurfaceDataLayer = () => {
  const zoom = useZoom();
  const enabled = useShowObs();
  const viewport = useViewportBounds();

  const displayTime = useDisplayTime();

  const { data } = useQuery(api.wxmap.wxmapMetars.queryOptions(undefined, { enabled, refetchInterval: MINUTE }));

  // construct our station priority list for each zoom level
  // this will give us a computed list of stations to show at each zoom level
  // use the predefined list of must-haves and then use a spatial algorithm to fill in the rest

  const stationPriorityList = useMemo(() => {
    if (!data) return { min: [], med: [], global: [] };
    const radius = { min: 240, med: 60, max: 1 };

    const key = "siteId";

    return {
      global: [...STATION_PRIORITY_CANADA, ...filterSpacedPoints(data, radius.min, key)],
      min: [...STATION_PRIORITY_MIN, ...filterSpacedPoints(data, radius.min, key)],
      med: [...STATION_PRIORITY_MED, ...filterSpacedPoints(data, radius.med, key)],
    };
  }, [data]);

  // for every site in our list of data, we want to get the metar with the observation that is closest
  // to our display time without being in the future and then collapse its properties into the final output

  if (!viewport || !enabled || !data) return;

  const features = data.features.reduce<StationPlotGeoJSON["features"]>((acc, feature) => {
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
          validTime: new Date(metar.validTime),
          siteId: feature.properties.siteId,
        },
      });
    }

    return acc;
  }, []);

  const resultFC: StationPlotGeoJSON = {
    type: "FeatureCollection",
    features,
  };

  return (
    <>
      {/* Clustered source for text that can be culled when too dense */}
      <Source
        id="cullable-plot-data"
        key="cullable-plot-data"
        type="geojson"
        data={resultFC}
        cluster={true}
        clusterRadius={20}
        clusterMaxZoom={14}
      >
        {/* Site ID labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-id"
          filter={UNCLUSTERED}
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
          filter={UNCLUSTERED}
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
          filter={UNCLUSTERED}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["get", "td"],
            "text-offset": [-1.5, 1.5],
            visibility: zoom > ZOOM_THRESHOLDS.maximum ? "visible" : "none",
          }}
        />

        {/* Weather and visibility labels */}
        <Layer
          {...STATION_TEXT_STYLE}
          id="layer-sfc-obs-wx"
          filter={UNCLUSTERED}
          layout={{
            ...STATION_TEXT_STYLE.layout,
            "text-field": ["concat", ["get", "vis"], " ", ["get", "wxString"]],
            "text-offset": [-1.5, 0],
            "text-anchor": "right",
            visibility: zoom > ZOOM_THRESHOLDS.reduced ? "visible" : "none",
          }}
        />
      </Source>

      {/* Non-clustered source for persistent elements */}
      <Source id="persistent-sfc-data" key="persistent-sfc-data" type="geojson" data={resultFC}>
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
    </>
  );
};
