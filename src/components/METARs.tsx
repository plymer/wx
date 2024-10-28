import useAPI from "@/hooks/useAPI";

import { OctagonAlert, OctagonX } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  site: string;
  hrs: number;
}

const METARs = ({ site, hrs }: Props) => {
  const [METARs, setMETARs] = useState<string[]>();

  // destructure the react-query object that is returned from the useAPI hook and pass the arguments
  const { data, fetchStatus, refetch } = useAPI("alpha/metars", [
    { param: "site", value: site },
    { param: "hrs", value: hrs },
  ]);

  // update the interface once we have new data to display
  useEffect(() => {
    if (data) setMETARs(data.metars);
  }, [fetchStatus]);

  // refetch the data whenever the user changes the interface options (site or time range)
  useEffect(() => {
    refetch();
  }, [site, hrs]);

  // return the JSX elements
  if (site && METARs && METARs.length > 0) {
    return (
      <>
        {METARs?.map((m: string, i: number) => (
          <div className="font-mono px-6 odd:bg-neutral-300 even:bg-neutral-800 even:text-white" key={i}>
            {m}
          </div>
        ))}
      </>
    );
  } else if (site && METARs && METARs.length === 0) {
    return (
      <div className="text-center">
        <OctagonAlert className="inline" /> No METARs available for {site}
      </div>
    );
  } else {
    return (
      <div className="text-center">
        <OctagonX className="inline" /> No site specified - Cannot retrieve METARs
      </div>
    );
  }
};

export default METARs;
