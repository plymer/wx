import useAPI from "@/hooks/useAPI";
import { METAR } from "@/lib/types";

import { Loader2, OctagonAlert, OctagonX, Skull } from "lucide-react";

interface Props {
  site: string;
  hrs: number;
}

const METARs = ({ site, hrs }: Props) => {
  // destructure the react-query object that is returned from the useAPI hook and pass the arguments
  const { data, isLoading } = useAPI<METAR>("alpha/metars", [
    { param: "site", value: site },
    { param: "hrs", value: hrs },
  ]);

  if (isLoading) {
    return (
      <div className="px-6 py-2 bg-muted">
        <Loader2 className="inline animate-spin" /> Loading METARs...
      </div>
    );
  }

  // return the JSX elements
  if (site && data && data.status === "success") {
    return (
      <>
        {data.metars.map((m: string, i: number) => (
          <div className="font-mono px-6 odd:bg-muted even:bg-muted-foreground ps-10 -indent-8" key={i}>
            {m}
          </div>
        ))}
      </>
    );
  } else if (site && data && data.status === "error") {
    return (
      <div className="px-6 py-2 bg-muted">
        <OctagonAlert className="inline" /> No METARs available for '{site.toUpperCase()}'
      </div>
    );
  } else if (!site) {
    return (
      <div className="px-6 py-2 bg-muted ">
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
