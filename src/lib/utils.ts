import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { NUM_HRS_DATA } from "./constants";
import { LayerDetails } from "./types";

export const parseTimes = (xml: string) => {
  const parser = new DOMParser();

  let dimString = parser
    .parseFromString(xml, "text/xml")
    .getElementsByTagName("Dimension")[0]
    .childNodes[0].nodeValue?.split("/");
  // console.log(dimString);
  if (dimString) {
    // the time closest to the current datetime
    let timeStart = Date.parse(dimString[0]);
    // the oldest available timestep for the data
    let timeEnd = Date.parse(dimString[1]);
    // the time slice between time steps
    let timeDiff = parseInt(dimString[2].replace(/[a-zA-z]/g, "")) * 1000 * 60;

    // we only want to allow for a certain number of hours of data to be displayed
    // we will assume NUM_HRS hours for testing
    // NUM_HRS hours * 60 minutes * 60 seconds * 1000 milliseconds
    let HRS_DATA = NUM_HRS_DATA * 1000 * 60 * 60;

    // check to see if the end time in the data range is longer than our cutoff
    // if it is, we use the data cutoff as our end time

    timeStart > timeEnd - HRS_DATA ? (timeStart = timeStart) : (timeStart = timeEnd - HRS_DATA);

    // calculate how many frames of data we are able to display for our total time range
    let timeSlices = (timeEnd - timeStart) / timeDiff;

    // console.log(timeEnd, timeStart, timeSlices);

    return {
      timeStart: timeStart,
      timeEnd: timeEnd,
      timeSlices: timeSlices,
      timeDiff: timeDiff,
    };
  }
};

export const makeISOTimeStamp = (time: number, mode: "display" | "data") => {
  var output: string = "";

  if (mode === "display") {
    output = new Date(time)
      .toISOString() // convert the unix epoch time into an ISO date string
      .replace(/:\d+.\d+Z$/g, "Z") // remove the seconds and milliseconds
      .replace("T", " "); // replace the "T" with a space
  } else if (mode === "data") {
    output = new Date(time)
      .toISOString() // convert the unix epoch time into an ISO date string
      .replace(/.\d+Z$/g, "Z"); // remove the milliseconds
  }

  return output;
};

/**
 * Create time steps for animation.
 * @param startTime the earliest time available in the dataset
 * @param endTime the most-recent time available in the dataset
 * @param timeSteps the number of frames available in the dataset
 * @returns an array of strings.
 */
export const generateTimeSteps = (startTime: number, endTime: number, timeSteps: number) => {
  // console.log("inputs for TimeStepGeneration:", startTime, endTime, timeSteps);
  const delta = (endTime - startTime) / timeSteps;
  var output: string[] = [];

  for (var i = 0; i < timeSteps; i++) {
    output[i] = makeISOTimeStamp(startTime + delta * i, "data");
  }

  return output;
};

export const layerManager = (layers: LayerDetails[]) => {
  layers.map((l, index) => {
    console.log(l, index);
  });
};
