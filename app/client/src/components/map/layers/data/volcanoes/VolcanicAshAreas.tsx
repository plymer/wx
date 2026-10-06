import { useDisplayTime } from "@/hooks/useDisplayTime";
import { Layer } from "react-map-gl/maplibre";

export const VolcanicAshAreas = () => {
  const displayTime = useDisplayTime();

  return (
    <>
      <Layer
        source="vector-tile-source"
        source-layer="volcano_fv_message_geometries"
        key="volcano-fv-message-polygons"
        filter={[
          "all",
          ["<=", ["get", "start_time"], ["to-number", displayTime]],
          [">", ["get", "expiry_time"], ["to-number", displayTime]],
        ]}
        type="fill"
        id="volcano-fv-message-polygons"
        layout={{}}
        paint={{
          "fill-color": "red",
          "fill-opacity": 0.2,
        }}
      />
      <Layer
        source="vector-tile-source"
        source-layer="volcano_fv_message_geometries"
        key="volcano-fv-message-times"
        filter={[
          "all",
          ["<=", ["get", "start_time"], ["to-number", displayTime]],
          [">", ["get", "expiry_time"], ["to-number", displayTime]],
        ]}
        type="symbol"
        id="volcano-fv-message-times"
        layout={{
          "text-field": ["concat", ["get", "volcano_name"], "\n", ["get", "valid_time_string"]],
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
