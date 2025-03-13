import { FetchStatus } from "@tanstack/react-query";

import { Loader2, OctagonAlert, OctagonX, Skull } from "lucide-react";
import { ParsedTAF, TAFData } from "../../lib/types";
import { useHighlightSigWx } from "../../hooks/useHighlightSigWx";

interface Props {
  site: string;
  data?: ParsedTAF;
  fetchStatus: FetchStatus;
}

const TAF = ({ site, data, fetchStatus }: Props) => {
  const highlightSigWx = useHighlightSigWx().highlightSigWx;

  if (!data && fetchStatus !== "idle") {
    return (
      <div className="px-6 py-2 bg-secondary text-black">
        <Loader2 className="inline animate-spin" /> Loading TAF...
      </div>
    );
  }
  // return the JSX elements
  if (site && data) {
    return (
      <div className="px-8 py-4 bg-muted text-black font-mono ">
        <div>{highlightSigWx(data.main)}</div>
        {data.partPeriods &&
          data.partPeriods.map((p, i) => (
            <div className="ms-8 -indent-4" key={i}>
              {highlightSigWx(p)}
            </div>
          ))}
        <div>{data.rmk}</div>
      </div>
    );
  } else if (site && !data) {
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
