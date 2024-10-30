// 3rd party imports
import {
  Globe,
  Loader2,
  MountainSnow,
  OctagonAlert,
  OctagonX,
  Skull,
  Sunrise,
  Sunset,
  TowerControl,
} from "lucide-react";
import { useEffect, useState } from "react";

// custom imports
import useAPI from "@/hooks/useAPI";
import { SiteData } from "@/lib/types";

interface Props {
  site: string;
}

const SiteMetadata = ({ site }: Props) => {
  const [APIData, setAPIData] = useState<SiteData>();

  // destructure the react-query object that is returned from the useAPI hook and pass the arguments
  const { data, isLoading, fetchStatus, refetch } = useAPI<SiteData>("alpha/sitedata", [
    { param: "site", value: site },
  ]);

  // update the interface once we have new data to display
  useEffect(() => {
    if (data) setAPIData(data);
  }, [fetchStatus]);

  // refetch the data whenever the user changes the interface options (site or time range)
  useEffect(() => {
    refetch();
  }, [site]);

  if (isLoading) {
    return (
      <div className="bg-neutral-800 py-2 text-white border-y-2 border-black">
        <Loader2 className="inline animate-spin" /> Loading metadata...
      </div>
    );
  }

  // return the JSX elements
  if (site && APIData && APIData.status === "success") {
    return (
      <div className="text-center bg-neutral-800 py-2 text-white border-y-2 border-black">
        <h2 className="text-xl font-bold">
          <TowerControl className="inline me-2" />
          {APIData.metadata.location}
        </h2>
        <div className="inline me-4 place-items-center text-sm">
          <Globe className="inline me-2 w-4 h-4" />
          {APIData.metadata.lat} {APIData.metadata.lon}
        </div>
        <div className="inline me-4 place-items-center text-sm">
          <MountainSnow className="inline me-2 w-4 h-4" />
          {APIData.metadata.elev_f} / {APIData.metadata.elev_m}
        </div>
        <div className="inline me-4 place-items-center text-sm">
          <Sunrise className="inline me-2 w-4 h-4" />
          {APIData.metadata.sunrise}
        </div>
        <div className="inline me-4 place-items-center text-sm">
          <Sunset className="inline me-2 w-4 h-4" />
          {APIData.metadata.sunset}
        </div>
      </div>
    );
  } else if (site && APIData && APIData.status === "error") {
    return (
      <div className="px-6 py-2 bg-neutral-800 text-white">
        <OctagonAlert className="inline" /> No site metadata available for site '{site.toUpperCase()}'
      </div>
    );
  } else if (!site) {
    return (
      <div className="px-6 py-2 bg-neutral-800 text-white">
        <OctagonX className="inline" /> No site specified - Cannot retrieve metadata
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

export default SiteMetadata;
