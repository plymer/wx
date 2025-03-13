// tailwindcss boilerplate things
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ParsedTAF, RasterLayerData, TAFData } from "./types";
import { SIGWX_REGEX } from "./regex";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// custom utils start
export const HOUR = 3_600_000;
export const MINUTE = 60_000;

export const makeISOTimeStamp = (time: number, mode: "display" | "data" = "display", hourMins?: boolean) => {
  switch (mode) {
    case "display":
      // if we specify the 'hour' flag, just return the hour
      return hourMins
        ? new Date(time)
            .toISOString() // convert the unix epoch time into an ISO date string
            .replace(/:\d+.\d+Z$/g, "Z") // remove the seconds and milliseconds
            .split("T")[1] // replace the "T" with a space
        : new Date(time)
            .toISOString() // convert the unix epoch time into an ISO date string
            .replace(/:\d+.\d+Z$/g, "Z") // remove the seconds and milliseconds
            .replace("T", " "); // replace the "T" with a space

    case "data":
      return new Date(time).toISOString().replace(/.\d+Z$/g, "Z");
  }
};

export function findNearestTimeStep(data: RasterLayerData, currentTime: number) {
  // set some large number to use as the initial check
  let diff = 999999999;
  // set the default timestep to the zeroth item of th array
  let closestTimeStep = 0;

  // loop over each timestep in the array
  data.timeSteps.forEach((timeStep, i) => {
    // calculate the absolute value of the difference between the time of the current frame
    // and the validTime of the current timeStep we are looking at
    const newDiff = Math.abs(currentTime - timeStep.validTime);

    // if the calculated difference is less than the current diff, use the calculated result
    // and then use the current timeStep's array index
    if (newDiff < diff) {
      diff = newDiff;
      closestTimeStep = i;
    }
  });

  return closestTimeStep;
}

/**
 *
 * @param taf the raw TAF string to parse
 * @returns a TAFData object with main, partPeriods, and rmk properties
 */
export function parseTaf(taf: string): ParsedTAF | undefined {
  // Split into main and parts without breaking the main TAF
  const parts = taf.split(/(FM\d{6}|TEMPO|BECMG|PROB\d{2}|RMK)/);
  const main = parts[0].trim();

  // Add newlines for the part periods processing
  const rawTAF = taf.replace(/(FM\d{6}|TEMPO|BECMG|PROB\d{2}|RMK)/g, "\n$1");

  // Use your existing period and remark extraction
  const partPeriods: string[] | undefined = [...rawTAF.matchAll(/(TEMPO.+|PROB30.+|PROB40.+|BECMG.+|FM\d{6}.+)/g)].map(
    (pp) => pp[0].trim()
  );

  const rmk: string | undefined = rawTAF.match(/(RMK.+)/g)?.[0];

  return { main, partPeriods, rmk };
}

/**
 * @param tafData the TafData object to parse
 * @returns Formatted TAF/METAR with significant weather wrapped in parentheses, or the original if no significant weather
 */
export function formatSigWx(alphaString: string | undefined, mode: "taf" | "metar"): ParsedTAF | string | undefined {
  if (!alphaString) return undefined;

  if (mode === "taf") console.log(alphaString);

  // Check for significant weather
  const sigCloud = alphaString.match(SIGWX_REGEX.cloudPattern);
  const sigFzPrecip = alphaString.match(SIGWX_REGEX.fzPrecipitation);
  const sigWind = alphaString.match(SIGWX_REGEX.windPattern);
  const sigIfrWx = alphaString.match(SIGWX_REGEX.ifrWxPattern);
  const sigTs = alphaString.match(SIGWX_REGEX.tsPattern);

  // Only format if significant weather is found
  if (sigCloud || sigFzPrecip || sigWind || sigIfrWx || sigTs) {
    // Process as before...
    const ifrMatches = Array.from(alphaString.matchAll(SIGWX_REGEX.ifrWxPattern)).filter(
      (match) => match.index !== undefined
    );

    const otherMatches = [
      ...Array.from(alphaString.matchAll(SIGWX_REGEX.cloudPattern)),
      ...Array.from(alphaString.matchAll(SIGWX_REGEX.windPattern)),
      ...Array.from(alphaString.matchAll(SIGWX_REGEX.tsPattern)),
      ...Array.from(alphaString.matchAll(SIGWX_REGEX.fzPrecipitation)),
    ].filter((match) => {
      if (!match.index) return false;
      return !ifrMatches.some((ifrMatch) => {
        const ifrStart = ifrMatch.index || 0;
        const ifrEnd = ifrStart + ifrMatch[0].length;
        return match.index >= ifrStart && match.index < ifrEnd;
      });
    });

    const allMatches = [...ifrMatches, ...otherMatches].sort((a, b) => (b.index || 0) - (a.index || 0));
    if (allMatches.length > 0) {
      // Process the TAF once, wrapping matches in brackets
      let formattedString = alphaString;
      allMatches.forEach((match) => {
        const matchText = match[0];
        const startPos = match.index || 0;
        formattedString =
          formattedString.slice(0, startPos) + `(${matchText})` + formattedString.slice(startPos + matchText.length);
      });

      if (mode === "taf") {
        return parseTaf(formattedString);
      } else if (mode === "metar") {
        return formattedString;
      }
    }
  } else {
    // Always return data even if no significant weather was found
    if (mode === "taf") {
      return parseTaf(alphaString);
    } else {
      return alphaString;
    }
  }
}
