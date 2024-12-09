import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
