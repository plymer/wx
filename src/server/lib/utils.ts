import suncalc, { GetTimesResult } from "suncalc";
import { LatLon, SunTimes } from "./common.types.js";
import { GeoMetModes, LayerProperties } from "./geomet.types.js";

export const FEET_PER_METRE = 3.28084;

export function injectViteDevServer(fileContents: string): string {
  var output = fileContents.replace(
    "<head>",
    `
  <script type="module">
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>

  <script type="module" src="/@vite/client"></script>
  `
  );
  return output;
}

export function leadZero(input: number): string {
  const inputString: string = input.toString();
  return inputString.length < 2 ? "0" + inputString : inputString;
}

type TempLayer = Omit<LayerProperties, "Dimension"> & {
  start?: number;
  startString?: string;
  end?: number;
  endString?: string;
  delta?: number;
  deltaString?: string;
  duration?: number;
};

export function coordinateTimes(layers: LayerProperties[], numOfFrames: number, mode: GeoMetModes) {
  // this will hold our temp data for our 'race'
  var temp: TempLayer[] = [];

  var output: LayerProperties[] = [];

  // loop over all the layers passed to us to generate our temp data
  layers.forEach((l, i) => {
    const timeArray = l.dimension!.split("/");

    const startTime = Date.parse(timeArray[0]);
    const endTime = Date.parse(timeArray[1]);
    const delta = parseInt(timeArray[2].replace(/[a-zA-Z]/g, "")) * 60 * 1000;
    const duration = endTime - startTime > 3 * 60 * 60 * 1000 ? 3 * 60 * 60 * 1000 : endTime - startTime;

    temp[i] = {
      ...l,
      start: startTime,
      end: endTime,
      delta: delta,
      duration: duration / (60 * 60 * 1000),
    };
  });

  // of the layers selected, this is the largest delta (timestep) and we will use this to drive our animation
  // we may move this logic to the client as a parameter that can be selected
  let largestDelta = 0;

  // find the largest time delta
  temp.forEach((l) => {
    if (l.delta! > largestDelta) {
      largestDelta = l.delta!;
    }
  });

  // set the start time and then iterate backwards from there to generate the realTimeArray
  // realTimeArray will contain timesteps that will be used to find the 'best data' to display at that time

  const currentTime = new Date();
  const deltaMinutes = largestDelta / 60000;
  const deltaModulo = currentTime.getUTCMinutes() % deltaMinutes;

  const realStartTime =
    mode === "loop"
      ? Date.UTC(
          currentTime.getUTCFullYear(),
          currentTime.getUTCMonth(),
          currentTime.getUTCDate(),
          currentTime.getUTCHours(),
          currentTime.getUTCMinutes() - deltaModulo
        )
      : Date.UTC(
          currentTime.getUTCFullYear(),
          currentTime.getUTCMonth(),
          currentTime.getUTCDate(),
          currentTime.getUTCHours(),
          currentTime.getUTCMinutes()
        );

  // initialize and populate our array that tracks what our timesteps are
  let realTimeArray: number[] = [];
  for (let i = 0; i < numOfFrames; i++) {
    realTimeArray.push(realStartTime - i * largestDelta);
  }

  // loop through all of our layers and generate valid timesteps for each,
  //   using our temporary layer objects
  temp.forEach((layer) => {
    // store our valid UTC timestamps that we calculate
    let layerFrameTimes: string[] = [];
    // initialize some offsets for our for-loop
    let frameOffset = 0;
    let syncOffset = 0;

    for (let i = 0; i < numOfFrames; i++) {
      if (mode === "loop") {
        // calculate the current time for the layer based on
        //  a) its end time defined in geomet
        //  b) its frameOffset depending on how many frames ahead of the main timestep it is
        //  c) its syncOffset depending on if we need to 'hold' frames in the animation
        //  d) its internal timestep
        let currentLayerTime = layer.end! - (i + frameOffset - syncOffset) * layer.delta!;

        // add a frame offset to allow us to skip frames that don't change at the same
        //   rate that the main timestep does
        while (currentLayerTime > realTimeArray[i]) {
          frameOffset++;
          currentLayerTime = layer.end! - (i + frameOffset) * layer.delta!;
        }

        // if our layer is behind the main time defined in the realTimeArray,
        //   and we haven't had to add any frame offsets because our data doesn't
        //   have a different time step, we need to sync up with the main flow
        //   of time, so add a time offset to catch up
        if (currentLayerTime < realTimeArray[i] && frameOffset === 0) {
          syncOffset++;
        }

        // push our calculated timestep to the output for the layer
        layerFrameTimes.push(makeISOTimeStamp(currentLayerTime));
      } else {
        layerFrameTimes.push(makeISOTimeStamp(layer.end!));
      }
    }

    delete layer.start;
    delete layer.end;
    delete layer.delta;
    delete layer.duration;
    delete layer.dimension;

    // we want to make sure that the layerFrameTimes here are 'reversed' such that the array
    //   of timesteps has the oldest times at the zeroth index
    output.push({ ...layer, timeSteps: layerFrameTimes.reverse() });
  });

  return {
    timeStep: largestDelta,
    timesAvailable: realTimeArray.reverse(),
    layers: output,
  };
}

export function makeISOTimeStamp(time: number, mode: "display" | "data" = "data") {
  return mode === "display"
    ? new Date(time)
        .toISOString() // convert the unix epoch time into an ISO date string
        .replace(/:\d+.\d+Z$/g, "Z") // remove the seconds and milliseconds
        .replace("T", " ") // replace the "T" with a space
    : new Date(time)
        .toISOString() // convert the unix epoch time into an ISO date string
        .replace(/.\d+Z$/g, "Z"); // remove the milliseconds
}

export function getSunTimes(lat: number, lon: number): SunTimes {
  // create a suncalc time object
  const times: GetTimesResult = suncalc.getTimes(new Date(), lat, lon);

  // set sunrise and sunset times to "---" when the sun doesn't rise or set today
  const riseString: string =
    times.sunrise.getUTCHours().toString() !== "NaN"
      ? leadZero(times.sunrise.getUTCHours()) + ":" + leadZero(times.sunrise.getUTCMinutes()) + "Z"
      : "---";
  const setString: string =
    times.sunsetStart.getUTCHours().toString() !== "NaN"
      ? leadZero(times.sunsetStart.getUTCHours()) + ":" + leadZero(times.sunsetStart.getUTCMinutes()) + "Z"
      : "---";

  return { rise: riseString, set: setString };
}

export function cardinalToDegrees(dir: string): number {
  const directionMap: { [key: string]: number } = {
    N: 0,
    NNE: 22.5,
    NE: 45,
    ENE: 67.5,
    E: 90,
    ESE: 112.5,
    SE: 135,
    SSE: 157.5,
    S: 180,
    SSW: 202.5,
    SW: 225,
    WSW: 247.5,
    W: 270,
    WNW: 292.5,
    NW: 315,
    NNW: 337.5,
    "-": 0,
  };

  // Return the degree corresponding to the given direction
  return directionMap[dir.toUpperCase()];
}

export function computeCoordinates(
  shape: string,
  bufferSize: number | undefined,
  coordinates?: LatLon[] | undefined
): LatLon[] | undefined {
  // console.log("computing coordinates for", shape, bufferSize, coordinateTimes);

  if (shape === "Canceled") return undefined;

  if (shape !== "Canceled" && !coordinates) return undefined;

  // convert bufferSize from NM into decimal degrees
  // 60 NM = 1 degree of latitude
  // we can also use a more complicated conversion involving longitude but for now this is fine
  const buffer = (bufferSize && bufferSize / 60) || 1;

  switch (shape) {
    case "circle":
      // use turf to calculate points on a circle depending on its radius and a default precision
      break;
    case "line_corridor":
      // a line_corridor has a minimum of 2 points, up to a maximum of 9(?)
      // calculate the normals for the line, and use that to calculate the outline of the polygon
      // check the tangent at the point and then calculate the normal of the tangent itself

      let output: LatLon[] = [];

      coordinates &&
        coordinates.forEach((point, index) => {
          const current = point; // the current point we're working with
          const next = coordinates[(index + 1) % coordinates.length]; // the next point in the sequence, or the first point

          let normal: LatLon;

          // the first and last points will calculate their normals based on the current and next/previous points
          //   but if we have three or more points, we have to calculate the tangent
          if (index === 0) {
            normal = computeNormalVector(current, next);
          } else if (index === coordinates.length - 1) {
            normal = computeNormalVector(next, current);
          } else {
            const tangent = computeTangentVector(coordinates[index - 1], current, next);
            normal = { lat: -tangent.lon, lon: tangent.lat };
          }

          output.push(
            { lat: current.lat + normal.lat * buffer, lon: current.lon + normal.lon * buffer },
            { lat: current.lat - normal.lat * buffer, lon: current.lon - normal.lon * buffer }
          );
        });
      return output;
  }
}

// given two points, calculate the normal (perpendicular) to the line segment
function computeNormalVector(p1: LatLon, p2: LatLon): LatLon {
  // calculate the slope of the line between the two points
  const dLon = p2.lon - p1.lon;
  const dLat = p2.lat - p1.lat;

  // channel your inner pythagoras
  const length = Math.sqrt(dLon * dLon + dLat * dLat);

  return { lat: -dLon / length, lon: dLat / length };
}

// given three points, calculate the tangent at the second point
function computeTangentVector(p1: LatLon, p2: LatLon, p3: LatLon): LatLon {
  // calculate the vector from p1-p2, and p2-p3
  const v1 = { lat: p2.lat - p1.lat, lon: p2.lon - p1.lon };
  const v2 = { lat: p3.lat - p2.lat, lon: p3.lon - p2.lon };

  // normalize our tangent vectors (pythagoras part 2, electric boogaloo)
  const l1 = Math.sqrt(v1.lat * v1.lat + v1.lon * v1.lon);
  const l2 = Math.sqrt(v2.lat * v2.lat + v2.lon * v2.lon);

  const v1n = { lat: v1.lat / l1, lon: v1.lon / l1 };
  const v2n = { lat: v2.lat / l2, lon: v2.lon / l2 };

  // use the average of the two tangents to calculate our final point to output
  const tangent = { lat: (v1n.lat + v2n.lat) / 2, lon: (v1n.lon + v2n.lon) / 2 };
  const length = Math.sqrt(tangent.lat * tangent.lat + tangent.lon * tangent.lon);

  // return the length-normalized tangent
  return { lat: tangent.lat / length, lon: tangent.lon / length };
}
