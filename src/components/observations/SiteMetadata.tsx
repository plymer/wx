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

// custom imports
import { SiteData } from "@/lib/types";

interface Props {
  site: string;
  data?: SiteData;
  fetchStatus: "fetching" | "idle" | "paused";
}

const SiteMetadata = ({ site, data, fetchStatus }: Props) => {
  if (fetchStatus !== "idle") {
    return (
      <div className="bg-neutral-800 py-2 text-white border-y-2 border-black">
        <Loader2 className="inline animate-spin" /> Loading metadata...
      </div>
    );
  }

  // return the JSX elements
  if (site && data && data.status === "success") {
    return (
      <div className="text-center bg-neutral-800 py-2 text-white border-y-2 border-black">
        <h2 className="text-xl font-bold">
          <TowerControl className="inline me-2" />
          {data.metadata.location}
        </h2>
        <div className="inline me-4 place-items-center text-sm">
          <Globe className="inline me-2 w-4 h-4" />
          {data.metadata.lat} {data.metadata.lon}
        </div>
        <div className="inline me-4 place-items-center text-sm">
          <MountainSnow className="inline me-2 w-4 h-4" />
          {data.metadata.elev_f} / {data.metadata.elev_m}
        </div>
        <div>
          <div className="inline me-4 place-items-center text-sm">
            <Sunrise className="inline me-2 w-4 h-4" />
            {data.metadata.sunrise}
          </div>
          <div className="inline me-4 place-items-center text-sm">
            <Sunset className="inline me-2 w-4 h-4" />
            {data.metadata.sunset}
          </div>
        </div>
      </div>
    );
  } else if (site && data && data.status === "error") {
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
