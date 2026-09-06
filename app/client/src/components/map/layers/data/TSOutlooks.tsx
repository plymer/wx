import { api } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { useClockTime } from "@/stateStores/map/animation";
import type { FeatureCollection } from "geojson";
import { Layer, Source } from "react-map-gl/maplibre";
import { useShowTSOutlooks } from "@/stateStores/map/vectorData";

export const TSOutlooks = () => {
  const enabled = useShowTSOutlooks();

  const currentTime = useClockTime();

  const { data } = useQuery(api.wxmap.tso.queryOptions(undefined, { enabled }));

  if (!data) return null;

  const tsoData: FeatureCollection = {
    type: "FeatureCollection",
    features: data.features.filter((f) => {
      const start = new Date(f.properties.validity_datetime).getTime();
      const end = new Date(f.properties.expiration_datetime).getTime();
      return start <= currentTime && currentTime <= end;
    }),
  };

  return (
    <Source id="tso-source" type="geojson" data={tsoData}>
      <Layer
        type="fill"
        id="tso-fill-layer"
        key="tso-fill-layer"
        beforeId="outlooks-target"
        paint={{
          "fill-color": [
            "match",
            ["get", "metobject.sub_type"],
            1,
            "grey",
            ["match", ["get", "metobject.risk_swo.value"], 1, "grey", 2, "yellow", 3, "red", "grey"],
          ],
          "fill-layer-opacity": 0.4,
        }}
        layout={{ "fill-sort-key": ["get", "metobject.risk_swo.value"] }}
      />
      <Layer
        type="line"
        id="tso-line-layer"
        key="tso-line-layer"
        beforeId="outlooks-target"
        paint={{ "line-color": "black", "line-width": 2, "line-dasharray": [4, 4] }}
        layout={{ "line-sort-key": ["get", "metobject.risk_swo.value"] }}
      />
      <Layer
        type="symbol"
        id="tso-gust-layer"
        key="tso-gust-layer"
        beforeId="outlooks-target"
        filter={["!=", ["get", "metobject.gust.value"], 0]}
        paint={{
          "icon-color": "black",
          "icon-halo-color": "white",
          "icon-halo-width": 1,
          "text-color": "black",
          "text-halo-color": "white",
          "text-halo-width": 1.5,
        }}
        layout={{
          "icon-allow-overlap": true,
          "text-allow-overlap": true,
          "icon-image": "icons:wind",
          "icon-size": 1,
          "icon-offset": [16, 16],
          "text-offset": [2, 1],
          "text-anchor": "left",
          "text-field": [
            "step",
            ["zoom"],
            "",
            4.5,
            [
              "concat",
              [
                "case",
                ["!=", ["typeof", ["get", "metobject.gust.value"]], "number"],
                [
                  "concat",
                  ["at", 0, ["array", ["get", "metobject.gust.value"]]],
                  "-",
                  ["at", 0, ["array", ["get", "metobject.gust.value"]]],
                ],
                ["to-string", ["get", "metobject.gust.value"]],
              ],
              " ",
              ["get", "metobject.gust.unit"],
            ],
          ],

          "symbol-sort-key": ["get", "metobject.risk_swo.value"],
        }}
      />
      <Layer
        type="symbol"
        id="tso-hail-layer"
        key="tso-hail-layer"
        beforeId="outlooks-target"
        filter={["!=", ["get", "metobject.hail.value"], 0]}
        paint={{
          "icon-color": "black",
          "icon-halo-color": "white",
          "icon-halo-width": 1,
          "text-color": "black",
          "text-halo-color": "white",
          "text-halo-width": 1.5,
        }}
        layout={{
          "icon-allow-overlap": true,
          "text-allow-overlap": true,
          "icon-image": "icons:hail",
          "icon-size": 1,
          "icon-offset": [-16, 16],
          "text-offset": [-2, 1],
          "text-anchor": "right",
          "text-field": [
            "step",
            ["zoom"],
            "",
            4.5,
            [
              "concat",
              [
                "case",
                ["!=", ["typeof", ["get", "metobject.hail.value"]], "number"],
                [
                  "concat",
                  ["at", 0, ["array", ["get", "metobject.hail.value"]]],
                  "-",
                  ["at", 0, ["array", ["get", "metobject.hail.value"]]],
                ],
                ["to-string", ["get", "metobject.hail.value"]],
              ],
              " ",
              ["get", "metobject.hail.unit"],
            ],
          ],

          "symbol-sort-key": ["get", "metobject.risk_swo.value"],
        }}
      />
      <Layer
        type="symbol"
        id="tso-rain-layer"
        key="tso-rain-layer"
        beforeId="outlooks-target"
        filter={["!=", ["get", "metobject.rain.value"], 0]}
        paint={{
          "icon-color": "black",
          "icon-halo-color": "white",
          "icon-halo-width": 1,
          "text-color": "black",
          "text-halo-color": "white",
          "text-halo-width": 1.5,
        }}
        layout={{
          "icon-allow-overlap": true,
          "text-allow-overlap": true,
          "icon-image": "icons:rain",
          "icon-size": 1,
          "icon-offset": [-16, -16],
          "text-offset": [-2, -1],
          "text-anchor": "right",
          "text-field": [
            "step",
            ["zoom"],
            "",
            4.5,
            [
              "concat",
              [
                "case",
                ["!=", ["typeof", ["get", "metobject.rain.value"]], "number"],
                [
                  "concat",
                  ["at", 0, ["array", ["get", "metobject.rain.value"]]],
                  "-",
                  ["at", 0, ["array", ["get", "metobject.rain.value"]]],
                ],
                ["to-string", ["get", "metobject.rain.value"]],
              ],
              " ",
              ["get", "metobject.rain.unit"],
            ],
          ],

          "symbol-sort-key": ["get", "metobject.risk_swo.value"],
        }}
      />
      <Layer
        type="symbol"
        id="tso-tornado-layer"
        key="tso-tornado-layer"
        beforeId="outlooks-target"
        filter={["!=", ["get", "metobject.tornado_risk.value"], false]}
        paint={{
          "icon-color": "black",
          "icon-halo-color": "white",
          "icon-halo-width": 1,
          "text-color": "black",
          "text-halo-color": "white",
          "text-halo-width": 1.5,
        }}
        layout={{
          "icon-allow-overlap": true,
          "text-allow-overlap": true,
          "icon-image": "icons:tornado",
          "icon-size": 1,
          "icon-offset": [16, -16],
          "text-offset": [2, -1],
          "text-anchor": "left",
          "text-field": [
            "step",
            ["zoom"],
            "",
            4.5,
            ["case", ["==", ["get", "metobject.sub_type"], 1], "Funnel Clouds", "Tornado"],
          ],

          "symbol-sort-key": ["get", "metobject.risk_swo.value"],
        }}
      />
    </Source>
  );
};
