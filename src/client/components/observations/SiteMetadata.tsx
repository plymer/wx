// 3rd party imports
import { Globe, MountainSnow, OctagonAlert, Skull, Sunrise, Sunset, TowerControl } from "lucide-react";
import { APIResponse, SiteData } from "@/lib/types";

// custom imports

interface Props {
  site: string;
  response: APIResponse<SiteData> | undefined;
}

const SiteMetadata = ({ site, response }: Props) => {
  if (!response) return;

  switch (response.status) {
    case "noData":
      return (
        <div className="px-6 py-2 bg-neutral-800 text-white">
          <OctagonAlert className="inline" /> No site metadata available for site '{site.toUpperCase()}'
        </div>
      );
    case "error":
      return (
        <div className="px-6 py-2 bg-neutral-800 text-destructive">
          <Skull className="inline" /> {response.message || "There was an unknown error"}
        </div>
      );
    case "success":
      const { name, lat, lon, elev_f, elev_m, sunrise, sunset } = response.data;
      return (
        <div className="text-center bg-neutral-800 py-2 text-white border-y-2 border-black">
          <h2 className="text-xl font-bold">
            <TowerControl className="inline me-2" />
            {name}
          </h2>
          <div className="inline me-4 place-items-center text-sm">
            <Globe className="inline me-2 w-4 h-4" />
            {lat} {lon}
          </div>
          <div className="inline me-4 place-items-center text-sm">
            <MountainSnow className="inline me-2 w-4 h-4" />
            {elev_f} / {elev_m}
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
