import { api } from "@/lib/trpc";
import { useShowHurricanes } from "@/stateStores/map/vectorData";
import { MINUTE } from "@shared/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { Source, Layer } from "react-map-gl/maplibre";
export const Hurricanes = () => {
  const enabled = useShowHurricanes();
  // types: track, error_cone, cyclone, wind_radii
  const data = useQuery(api.wxmap.hurricanes.queryOptions(undefined, { enabled, refetchInterval: 10 * MINUTE }));

  if (!enabled || !data.data) return null;

  return (
    <Source id="hurricanes" key="hurricanes" type="geojson" data={data.data}>
      <Layer
        id="layer-hurricanes-track"
        key="layer-hurricanes-track"
        type="line"
        source="hurricanes"
        filter={["==", ["get", "type"], "track"]}
        paint={{
          "line-color": "white",
          "line-dasharray": [4, 4],
          "line-width": 2,
        }}
      />

      <Layer
        id="layer-hurricanes-error-outline"
        key="layer-hurricanes-error-outline"
        type="line"
        source="hurricanes"
        filter={["==", ["get", "type"], "error_cone"]}
        paint={{
          "line-color": "white",
          "line-dasharray": [4, 4],
          "line-width": 2,
        }}
      />
      <Layer
        id="layer-hurricanes-error-fill"
        key="layer-hurricanes-error-fill"
        type="fill"
        source="hurricanes"
        filter={["==", ["get", "type"], "error_cone"]}
        paint={{
          "fill-color": "white",
          "fill-opacity": 0.2,
        }}
      />
      <Layer
        id="layer-hurricanes-name"
        key="layer-hurricanes-name"
        type="symbol"
        source="hurricanes"
        filter={["==", ["get", "type"], "error_cone"]}
        paint={{
          "text-color": "black",
          "text-halo-color": "white",
          "text-halo-width": 12,
        }}
        layout={{
          "symbol-placement": "line",
          "text-field": ["get", "storm_name"],
          "text-allow-overlap": true,
          "symbol-spacing": ["interpolate", ["linear"], ["zoom"], 0, 200, 2, 1600, 10, 600],
        }}
      />
      <Layer
        id="layer-hurricanes-radii"
        key="layer-hurricanes-radii"
        type="line"
        source="hurricanes"
        filter={["==", ["get", "type"], "wind_radii"]}
        paint={{
          "line-color": [
            "let",
            "speed",
            ["at", 3, ["split", ["get", "id"], "_"]],
            ["match", ["var", "speed"], "34", "yellow", "48", "orange", "red"],
          ],
          "line-width": 2,
        }}
      />
      <Layer
        id="layer-hurricanes-radii-label"
        key="layer-hurricanes-radii-label"
        type="fill"
        source="hurricanes"
        filter={["==", ["get", "type"], "wind_radii"]}
        paint={{
          "fill-color": [
            "let",
            "speed",
            ["at", 3, ["split", ["get", "id"], "_"]],
            ["match", ["var", "speed"], "34", "yellow", "48", "orange", "red"],
          ],
          "fill-opacity": 0.2,
        }}
      />
      <Layer
        id="layer-hurricanes-position"
        key="layer-hurricanes-position"
        type="circle"
        source="hurricanes"
        filter={["==", ["get", "type"], "cyclone"]}
        paint={{
          "circle-radius": 6,
          "circle-color": "red",
          "circle-stroke-color": "black",
          "circle-stroke-width": 2,
        }}
      />
      <Layer
        id="layer-hurricanes-pos-label"
        key="layer-hurricanes-pos-label"
        type="symbol"
        source="hurricanes"
        minzoom={4}
        filter={["==", ["get", "type"], "cyclone"]}
        paint={{ "text-color": "white", "text-halo-color": "black", "text-halo-width": 2 }}
        layout={{
          "text-size": 12,
          "text-anchor": "top",
          "text-offset": [0, 0.5],
          "text-field": [
            "step",
            ["zoom"],
            [
              "concat",
              ["at", 2, ["split", ["at", 0, ["split", ["get", "forecast_datetime"], "T"]], "-"]],
              "/",
              ["at", 0, ["split", ["at", 1, ["split", ["get", "forecast_datetime"], "T"]], ":"]],
              ":",
              ["at", 1, ["split", ["at", 1, ["split", ["get", "forecast_datetime"], "T"]], ":"]],
              "Z",
            ],
            7,
            [
              "let",
              "subType",
              ["get", "sub_type", ["get", "metobject"]],
              [
                "concat",
                [
                  "case",
                  ["!=", ["var", "subType"], "STORM"],
                  ["join", ["split", ["var", "subType"], "_"], " "],
                  "TROPICAL STORM",
                ],
                " ",
                ["concat", ["get", "value", ["get", "max_wind", ["get", "metobject"]]], "KT"],
                " @ ",
                ["at", 2, ["split", ["at", 0, ["split", ["get", "forecast_datetime"], "T"]], "-"]],
                "/",
                ["at", 0, ["split", ["at", 1, ["split", ["get", "forecast_datetime"], "T"]], ":"]],
                ":",
                ["at", 1, ["split", ["at", 1, ["split", ["get", "forecast_datetime"], "T"]], ":"]],
                "Z",
              ],
            ],
          ],
        }}
      />
    </Source>
  );
};
