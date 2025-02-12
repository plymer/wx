import { FetchStatus } from "@tanstack/react-query";

import { Loader2, OctagonAlert, OctagonX, Skull } from "lucide-react";
import { TAFData } from "../../lib/types";

interface Props {
  site: string;
  data?: TAFData;
  fetchStatus: FetchStatus;
}

const TAF = ({ site, data, fetchStatus }: Props) => {
  if (fetchStatus !== "idle") {
    return (
      <div className="px-6 py-2 bg-secondary text-black">
        <Loader2 className="inline animate-spin" /> Loading TAF...
      </div>
    );
  }
  // return the JSX elements
  if (site && data?.status === "success") {
    return (
      <div className="px-8 py-4 bg-muted text-black font-mono ">
        <div>{data.taf.main}</div>
        {data.taf.partPeriods &&
          data.taf.partPeriods.map((p, i) => (
            <div className="ms-8 -indent-4" key={i}>
              {p}
            </div>
          ))}
        <div>{data.taf.rmk}</div>
      </div>
    );
  } else if (site && data && data.status === "error") {
    return (
      <div className="px-6 py-2 bg-muted text-black">
        <OctagonAlert className="inline" /> No TAF available for '{site.toUpperCase()}'
      </div>
    );
  } else if (!site) {
    return (
      <div className="px-6 py-2 bg-muted text-black">
        <OctagonX className="inline" /> No site specified - Cannot retrieve TAF
      </div>
    );
  } else {
    return (
      <div className="px-6 py-2 bg-neutral-800 text-destructive">
        <Skull className="inline" /> There was an unknown error
      </div>
    );
  }
};

export default TAF;
