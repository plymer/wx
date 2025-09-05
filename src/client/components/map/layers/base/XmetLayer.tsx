// library imports
import { Layer, Source } from "react-map-gl/maplibre";
import { useMemo } from "react";
import * as turf from "@turf/turf";
import type { Feature, MultiPolygon } from "geojson";

// generic types
import type { APIResponse, XmetTypes, XmetAPIData, XmetGeoJSON } from "@/lib/types";

// vector data configs
import { AIRMET_DISPLAY, AIRMET_DISPLAY_OUTLINE, SIGMET_DISPLAY, SIGMET_DISPLAY_OUTLINE } from "@/config/vectorData";

import { useCurrentTime } from "@/hooks/useCurrentTime";
import { HOUR, MINUTE } from "@shared/lib/constants";

interface Props {
  dataType: XmetTypes;
  jsonData: APIResponse<XmetGeoJSON> | undefined;
  belowLayer: string;
}

const makeAlphaCode = (feature: Feature<MultiPolygon, XmetAPIData>) => {
  const props = feature.properties;

  const isConvective = props.sequenceId === "conv";

  if (isConvective) return `${props.numberCode}${props.charCode}`;
  else return `${props.charCode}${props.issuer === "CWAO" ? "" : " "}${props.numberCode}`;
};

/**
 * A function to de-duplicate sigmets and airmets and combine their alphaCodes when an event crosses FIR boundaries
 * @param features Array of Xmet features to deduplicate
 * @returns An array of deduplicated Xmet features
 */
const dedupeFeatures = (features: Feature<MultiPolygon, XmetAPIData>[]) => {
  const xmets = new Map<string, Feature<MultiPolygon, XmetAPIData>[]>();

  features.forEach((feature) => {
    // use geometry, startTime, and endTime as the dedupe key
    const geomHash = JSON.stringify(feature.geometry);
    const key = `${geomHash}|${feature.properties.startTime}|${feature.properties.endTime}`;

    if (!xmets.has(key)) {
      xmets.set(key, []);
    }
    xmets.get(key)!.push(feature);
  });

  return Array.from(xmets.values()).map((xmetGroup) => {
    if (xmetGroup.length === 1) {
      // if we have only one feature in the group, generate the alphaCode and return it
      xmetGroup[0].properties.alphaCode = makeAlphaCode(xmetGroup[0]);
      return xmetGroup[0];
    } else {
      // otherwise, merge the alphaCodes and return a single feature
      const alphaCodes = xmetGroup.map((f) => makeAlphaCode(f)).filter(Boolean);
      const merged = { ...xmetGroup[0], properties: { ...xmetGroup[0].properties } };
      merged.properties.alphaCode = alphaCodes.join("/");
      return merged;
    }
  });
};

const applyMotionVector = (currentTime: number, startTime: number, feature: Feature<MultiPolygon, XmetAPIData>) => {
  // if we have no motion vector, our object is stationary so bail out
  if (!feature || !feature.properties || !feature.properties.motionVector) return feature;

  // calculate the elapsed time in milliseconds
  const elapsedTime = (currentTime - startTime) / HOUR;

  // speed is in knots
  const spd = feature.properties.motionVector.speed;

  // direction is in degrees, or can be null for STNR Xmets
  const direction = feature.properties.motionVector.direction ?? 0;

  // nautical miles traveled in the elapsed time
  const distance = spd * elapsedTime;

  const translated = turf.transformTranslate(turf.multiPolygon(feature.geometry.coordinates), distance, direction, {
    units: "nauticalmiles",
  });

  return { ...translated, properties: feature.properties };
};

const getCoM = (feature: Feature<MultiPolygon, XmetAPIData>) => {
  // calculate the center of mass for the feature to use for the label
  const center = turf.centerOfMass(feature).geometry.coordinates;

  return turf.feature({ type: "Point", coordinates: center }, feature.properties);
};

const XmetLayer = ({ dataType, jsonData, belowLayer }: Props) => {
  const currentTime = useCurrentTime();

  const processedData = useMemo(() => {
    if (!jsonData || jsonData.status !== "success") return null;

    console.log(jsonData);

    return {
      ...jsonData,
      data: {
        ...jsonData.data,
        features: jsonData.data.features.map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            dataType,
          },
        })),
      },
    };
  }, [jsonData, dataType]);

  if (!processedData || processedData.status !== "success") return null;

  const rawFeatures = processedData.data.features;

  const groupedXmets = rawFeatures?.reduce(
    (accumulator, xmet) => {
      const { sequenceId } = xmet.properties;

      const key = sequenceId;
      // if we don't have a key for this domain and sequence, create one
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(xmet);
      return accumulator;
    },
    {} as Record<string, Feature<MultiPolygon, XmetAPIData>[]>,
  );

  // loop over each group of xmets and sort them by their issue time, adjusting endTimes as necessary to allow for filtering of superceded events
  Object.values(groupedXmets).forEach((xmets) => {
    // sort by ascending issue time
    // if the result of the comparison is negative a is sorted before b
    xmets.sort((a, b) => a.properties.startTime - b.properties.startTime);

    for (let i = 0; i < xmets.length - 1; i++) {
      // for non-convective sigmets, we can just set the end time to the group's next start time
      if (!xmets[i].properties.sequenceId.includes("conv")) {
        xmets[i].properties.endTime = xmets[i + 1].properties.startTime; // supercede the end time with the next start time
      } else {
        // convective sigmets are technically 2 hours long, but are nominally updated every hour at 55 minutes past the hour
        // two cases to handle:
        // 1. if the issue time is at 55 minutes past the hour, set the end time to the start time plus 1 hour
        // 2. the issue time is not at the usual 55 minutes past the hour (e.g., special sigmet issued outside of the usual schedule)
        //    in this case we need to find the next 55-minute issue mark and set the end time to that
        xmets[i].properties.endTime = Math.min(
          xmets[i].properties.startTime + HOUR,
          xmets[i].properties.startTime - (xmets[i].properties.startTime % HOUR) + 55 * MINUTE + HOUR,
        );
      }
    }
  });

  // deduplicate all features, and check for features that are valid at our current time
  const validFeatures = dedupeFeatures(Object.values(groupedXmets).flatMap((features) => features))
    .filter((f) => {
      // if we have no properties or null coordinates (a cancelled feature), just filter this feature out
      if (!f.properties || f.geometry.coordinates[0] === null) return false;

      return f.properties.startTime <= currentTime && f.properties.endTime > currentTime;
    })
    .map((f) => {
      // apply our motion vector if applicable

      if ((dataType === "airmet" || dataType === "sigmet") && f.properties)
        return applyMotionVector(currentTime, f.properties.startTime, f);
      else return f;
    })
    .filter((f) => f !== null || f !== undefined);

  // create a feature collection of the centres of mass of each Xmet to pin the label to
  const featureLabels = validFeatures.map((f) => getCoM(f)).filter((f) => f !== null);

  // check which layer style we need to use depending on our dataType
  const fillStyle = dataType === "airmet" ? AIRMET_DISPLAY : SIGMET_DISPLAY;
  const outlineStyle = dataType === "airmet" ? AIRMET_DISPLAY_OUTLINE : SIGMET_DISPLAY_OUTLINE;

  return (
    <>
      <Source type="geojson" id={`${dataType}-labels`} data={{ type: "FeatureCollection", features: featureLabels }}>
        <Layer
          beforeId={belowLayer}
          key={`layer-${dataType}-text`}
          id={`layer-${dataType}-text`}
          type="symbol"
          layout={{
            "text-field": ["get", "alphaCode"],
            "text-allow-overlap": true,
            "text-font": ["Consolas-Regular"],
          }}
          paint={{
            "text-color": "#fff",
            "text-halo-color": "#000",
            "text-halo-width": 1,
          }}
        />
      </Source>
      <Source type="geojson" id={`${dataType}-data`} data={{ ...processedData.data, features: validFeatures }}>
        <Layer {...outlineStyle} key={`layer-${dataType}-outline`} beforeId={`layer-${dataType}-text`} />
        <Layer {...fillStyle} key={`layer-${dataType}`} beforeId={outlineStyle.id} />
      </Source>
    </>
  );
};

export default XmetLayer;
