import { useDisplayTime } from "@/hooks/useDisplayTime";
import type { FilterSpecification } from "maplibre-gl";
import { Layer } from "react-map-gl/maplibre";

export const VolcanicAshAreas = () => {
  const displayTime = useDisplayTime();

  const filter: FilterSpecification = [
    "all",
    ["<=", ["get", "start_time"], ["to-number", displayTime]],
    [">", ["get", "expiry_time"], ["to-number", displayTime]],
  ];

  return (
    <>
      <Layer
        source="vector-tile-source"
        source-layer="volcano_fv_message_geometries"
        key="volcano-fv-message-fill-t6"
        filter={[...filter, ["==", ["get", "geo_index"], 1]]}
        type="fill"
        id="volcano-fv-message-fill-t6"
        paint={{
          "fill-color": "orange",
          "fill-layer-opacity": 0.5,
        }}
      />
      <Layer
        source="vector-tile-source"
        source-layer="volcano_fv_message_geometries"
        key="volcano-fv-message-outline-t6"
        filter={[...filter, ["==", ["get", "geo_index"], 1]]}
        type="line"
        id="volcano-fv-message-outline-t6"
        paint={{
          "line-color": "orange",
          "line-opacity": 0.8,
          "line-width": 4,
        }}
      />
      <Layer
        source="vector-tile-source"
        source-layer="volcano_fv_message_geometries"
        key="volcano-fv-message-fill-obs"
        filter={[...filter, ["==", ["get", "geo_index"], 0]]}
        type="fill"
        id="volcano-fv-message-fill-obs"
        paint={{
          "fill-color": "purple",
          "fill-layer-opacity": 0.8,
        }}
      />
      <Layer
        source="vector-tile-source"
        source-layer="volcano_fv_message_geometries"
        key="volcano-fv-message-outline-obs"
        filter={[...filter, ["==", ["get", "geo_index"], 0]]}
        type="line"
        id="volcano-fv-message-outline-obs"
        paint={{
          "line-color": "purple",
          "line-opacity": 1,
          "line-width": 4,
        }}
      />
      <Layer
        source="vector-tile-source"
        source-layer="volcano_fv_message_geometries"
        key="volcano-fv-message-times"
        filter={[...filter, ["!=", ["get", "geo_index"], 2], ["!=", ["get", "geo_index"], 3]]}
        type="symbol"
        id="volcano-fv-message-times"
        layout={{
          "symbol-placement": "point",
          "symbol-spacing": 2400,
          "text-field": [
            "step",
            ["zoom"],
            "",
            6,
            [
              "concat",
              ["get", "volcano_name"],
              "\n",
              ["get", "valid_time_string"],
              " (T+",
              ["*", ["get", "geo_index"], 6],
              ")",
            ],
          ],
        }}
        paint={{
          "text-color": "white",
          "text-halo-color": "black",
          "text-halo-width": 2,
        }}
      />
    </>
  );
};
