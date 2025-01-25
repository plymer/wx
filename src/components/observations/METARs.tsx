import { METAR } from "@/lib/types";

import { OctagonAlert, OctagonX, Skull } from "lucide-react";
import { useEffect, useRef } from "react";
import { FetchStatus } from "@tanstack/react-query";
import LoadingIndicator from "@/components/ui/LoadingIndicator";

interface Props {
  site: string;
  data?: METAR;
  fetchStatus: FetchStatus;
}

const METARs = ({ site, data, fetchStatus }: Props) => {
  const scrollTargetRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    scrollTargetRef.current?.scrollIntoView({ behavior: "instant" });
  }, [data, fetchStatus]);

  if (fetchStatus !== "idle") return <LoadingIndicator displayText="Loading METARs" />;

  // return the JSX elements
  if (site && data && data.status === "success") {
    return (
      <div>
        {data.metars.map((m: string, i: number) => (
          <div className="font-mono px-6 odd:bg-muted even:bg-muted-foreground ps-10 -indent-8" key={i}>
            {m}
          </div>
        ))}
        <div ref={scrollTargetRef}></div>
      </div>
    );
  } else if (site && data && data.status === "error") {
    return (
      <div className="px-6 py-2 bg-muted">
        <OctagonAlert className="inline" /> No METARs available for '{site.toUpperCase()}'
      </div>
    );
  } else if (!site) {
    return (
      <div className="px-6 py-2 bg-muted">
        <OctagonX className="inline" /> No site specified - Cannot retrieve METARs
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

export default METARs;
