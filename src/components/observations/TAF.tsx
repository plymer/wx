import useAPI from "@/hooks/useAPI";
import { TAFData } from "@/lib/types";

import { Loader2, OctagonAlert, OctagonX, Skull } from "lucide-react";

interface Props {
  site: string;
}

const TAF = ({ site }: Props) => {
  // destructure the react-query object that is returned from the useAPI hook and pass the arguments
  const { data, fetchStatus } = useAPI<TAFData>("alpha/taf", [{ param: "site", value: site }]);

  if (fetchStatus !== "idle") {
    return (
      <div className="px-6 py-2 bg-secondary">
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
      <div className="px-6 py-2 bg-muted">
        <OctagonAlert className="inline" /> No TAF available for '{site.toUpperCase()}'
      </div>
    );
  } else if (!site) {
    return (
      <div className="px-6 py-2 bg-muted">
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
