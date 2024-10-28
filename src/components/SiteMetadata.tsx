// 3rd party imports
import { Globe, MountainSnow, OctagonX, Sunrise, Sunset, TowerControl } from "lucide-react";
import { useEffect, useState } from "react";

// custom imports
import useAPI from "@/hooks/useAPI";
import { SiteData } from "@/lib/types";

interface Props {
  site: string;
}

const SiteMetadata = ({ site }: Props) => {
  const [metadata, setMetadata] = useState<SiteData>();

  // destructure the react-query object that is returned from the useAPI hook and pass the arguments
  const { data, fetchStatus, refetch } = useAPI("alpha/sitedata", [{ param: "site", value: site }]);

  // update the interface once we have new data to display
  useEffect(() => {
    if (data) setMetadata(data);
  }, [fetchStatus]);

  // refetch the data whenever the user changes the interface options (site or time range)
  useEffect(() => {
    refetch();
  }, [site]);

  // return the JSX elements
  if (site && metadata) {
    return (
      <div className="text-center bg-neutral-800 py-2 text-white border-y-2 border-black">
        <h2 className="text-xl font-bold">
          <TowerControl className="inline me-2" />
          {metadata.location}
        </h2>
        <div className="inline me-4 place-items-center text-sm">
          <Globe className="inline me-2 w-4 h-4" />
          {metadata.lat} {metadata.lon}
        </div>
        <div className="inline me-4 place-items-center text-sm">
          <MountainSnow className="inline me-2 w-4 h-4" />
          {metadata.elev_f} / {metadata.elev_m}
        </div>
        <div className="inline me-4 place-items-center text-sm">
          <Sunrise className="inline me-2 w-4 h-4" />
          {metadata.sunrise}
        </div>
        <div className="inline me-4 place-items-center text-sm">
          <Sunset className="inline me-2 w-4 h-4" />
          {metadata.sunset}
        </div>
      </div>
    );
  } else {
    return (
      <div className="text-center">
        <OctagonX className="inline" /> No site specified - Cannot retrieve metadata
      </div>
    );
  }
};

export default SiteMetadata;
