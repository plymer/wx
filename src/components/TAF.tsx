import useAPI from "@/hooks/useAPI";
import { TAFData } from "@/lib/types";
import { OctagonX } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  site: string;
}

const TAF = ({ site }: Props) => {
  const [TAF, setTAF] = useState<TAFData>();

  // destructure the react-query object that is returned from the useAPI hook and pass the arguments
  const { data, fetchStatus, refetch } = useAPI("alpha/taf", [{ param: "site", value: site }]);

  // update the interface once we have new data to display
  useEffect(() => {
    if (data) setTAF(data);
  }, [fetchStatus]);

  // refetch the data whenever the user changes the interface options (site or time range)
  useEffect(() => {
    refetch();
  }, [site]);

  // return the JSX elements
  if (site && TAF) {
    return (
      <div className="px-8 py-4 bg-neutral-300 text-black font-mono ">
        <div className="font-bold">{TAF.main}</div>
        {TAF.partPeriods
          ? TAF.partPeriods.map((p, i) => (
              <div className="ms-4" key={i}>
                {p}
              </div>
            ))
          : ""}
        <div>{TAF.rmk}</div>
      </div>
    );
  } else {
    return (
      <div className="text-center">
        <OctagonX className="inline" /> No site specified - Cannot retrieve TAF
      </div>
    );
  }
};

export default TAF;
