import useAPI from "@/hooks/useAPI";
import { METAR } from "@/lib/types";

import { Loader2, OctagonAlert, OctagonX, Skull } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  site: string;
  hrs: number;
}

const METARs = ({ site, hrs }: Props) => {
  const [APIData, setAPIData] = useState<METAR>();

  // destructure the react-query object that is returned from the useAPI hook and pass the arguments
  const { data, isLoading, fetchStatus, refetch } = useAPI<METAR>("alpha/metars", [
    { param: "site", value: site },
    { param: "hrs", value: hrs },
  ]);

  // update the interface once we have new data to display
  useEffect(() => {
    if (data) setAPIData(data);
  }, [fetchStatus]);

  // refetch the data whenever the user changes the interface options (site or time range)
  useEffect(() => {
    refetch();
  }, [site, hrs]);

  if (isLoading) {
    return (
      <div className="px-6 py-2 bg-neutral-300">
        <Loader2 className="inline animate-spin" /> Loading METARs...
      </div>
    );
  }

  // return the JSX elements
  if (site && APIData && APIData.status === "success") {
    return (
      <>
        {APIData.metars.map((m: string, i: number) => (
          <div className="font-mono px-6 odd:bg-neutral-300 even:bg-neutral-800 even:text-white" key={i}>
            {m}
          </div>
        ))}
      </>
    );
  } else if (site && APIData && APIData.status === "error") {
    return (
      <div className="px-6 py-2 bg-neutral-300">
        <OctagonAlert className="inline" /> No METARs available for '{site.toUpperCase()}'
      </div>
    );
  } else if (!site) {
    return (
      <div className="px-6 py-2 bg-neutral-300 ">
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
