import useAPI from "@/hooks/useAPI";
import { useDisplayTime } from "@/hooks/useDisplayTime";
import { useShowObs } from "@/stateStores/map/vectorData";
import { HOUR } from "@shared/lib/constants";
import { StationPlotData, StationPlotGeoJSON } from "@shared/lib/types";
import { FeatureCollection, Point } from "geojson";
import { Layer, Source, SymbolLayerSpecification } from "react-map-gl/maplibre";

export const SURFACE_OBS_STYLE: SymbolLayerSpecification = {
  id: "layer-surface-obs",
  type: "symbol",
  source: "surface-obs",
  layout: {
    "icon-image": "icons:stn-hwos",
  },
  paint: {
    "icon-color": "#ffcc00",
    "icon-halo-color": "#000000",
    "icon-halo-width": 1,
    "icon-halo-blur": 0.5,
  },
};

export const SurfaceDataLayer = () => {
  const enabled = useShowObs();

  const displayTime = useDisplayTime();

  const { data: plots } = useAPI<FeatureCollection<Point, StationPlotData>>("/wxmap/metars", {});

  if (!enabled || plots?.status !== "success") return;

  // for every site in our list of plots, we want to get the metar with the observation that is closest
  // to our display time without being in the future and then collapse its properties into the final output

  const features = plots.data.features.reduce<StationPlotGeoJSON["features"]>((acc, feature) => {
    const metar = feature.properties.metars
      .sort((a, b) => {
        const aDiff = displayTime - new Date(a.validTime).getTime();
        const bDiff = displayTime - new Date(b.validTime).getTime();
        return aDiff - bDiff;
      })
      .find(
        (m) => new Date(m.validTime).getTime() <= displayTime && new Date(m.validTime).getTime() >= displayTime - HOUR,
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

  const resultFC: StationPlotGeoJSON = {
    type: "FeatureCollection",
    features,
  };
  return (
    <Source id="surface-obs" type="geojson" data={resultFC}>
      <Layer {...SURFACE_OBS_STYLE} />
    </Source>
  );
};
