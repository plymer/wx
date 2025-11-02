// 3rd party imports
import { AlertOctagon, Globe, MountainSnow, Sunrise, Sunset, TowerControl } from "lucide-react";
import type { SiteData } from "@/lib/types";

// custom imports

interface Props {
  response: SiteData | undefined;
}

const SiteMetadata = ({ response }: Props) => {
  if (!response) {
    return (
      <div className="flex justify-center gap-2">
        <AlertOctagon />
        <span>No metadata found</span>
      </div>
    );
  } else {
    // destructure the response data
    const { name, lat, lon, elev_f, elev_m, sunrise, sunset, country, state } = response;

    // we want to show the state/province for usa/canada, otherwise just the country
    const location = `${name}, ${country === "US" || country === "CA" ? state : country}`;

    return (
      <div className="text-center bg-neutral-800 py-2 text-white border-y-2 border-black">
        <h2 className="text-xl font-bold">
          <TowerControl className="inline me-2" />
          {location}
        </h2>
        <div className="inline me-4 place-items-center text-sm">
          <Globe className="inline me-2 w-4 h-4" />
          {lat} {lon}
        </div>
        <div className="inline me-4 place-items-center text-sm">
          <MountainSnow className="inline me-2 w-4 h-4" />
          {elev_f && elev_m ? `${elev_f} ft / ${elev_m} m` : "Elevation Unknown"}
        </div>
        <div>
          <div className="inline me-4 place-items-center text-sm">
            <Sunrise className="inline me-2 w-4 h-4" />
            {sunrise}
          </div>
          <div className="inline me-4 place-items-center text-sm">
            <Sunset className="inline me-2 w-4 h-4" />
            {sunset}
          </div>
        </div>
      </div>
    );
  }
};

export default SiteMetadata;
