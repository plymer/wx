// third-party libraries
import { useRef } from "react";
import { RefreshCw, Search } from "lucide-react";

// custom hooks
import useAPI from "@/hooks/useAPI";

// custom types
import { METAR, SiteData, TAFData } from "@/lib/types";

// ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// stateStore
import { useObservations } from "@/stateStores/observations";

// child components
import METARs from "@/components/observations/METARs";
import SiteMetadata from "@/components/observations/SiteMetadata";
import TAF from "@/components/observations/TAF";

export default function Observations() {
  // create a ref to the siteId text input
  const siteId = useRef("");

  // use a context to store state so that when we come back to this tab it restores our obs/taf search
  const obs = useObservations((state) => state);

  // hours that are available as options in the dropdown list
  const HOURS: number[] = [6, 12, 18, 24, 36, 48, 96];

  // fetch all data within the route and then pass it to the child components for each data type
  const { data: metarData, fetchStatus: metarFetchStatus } = useAPI<METAR>("alpha/metars", [
    { param: "site", value: obs.site },
    { param: "hrs", value: obs.hours },
  ]);

  const { data: metaData, fetchStatus: metaFetchStatus } = useAPI<SiteData>("alpha/sitedata", [
    { param: "site", value: obs.site },
  ]);

  const { data: tafData, fetchStatus: tafFetchStatus } = useAPI<TAFData>("alpha/taf", [
    { param: "site", value: obs.site },
  ]);

  // validate the input and mutate the search string, passing it to the context and then it will propagate to the child components
  //   to show the user the data they have requested
  function handleInputText(input: string) {
    // we want to allow 2, 3, and 4-letter idents to be used
    // for 2-letter idents, assume we are doing a major canadian site and prepend with "cy"
    // for 3-letter idents, assume we are doing a canadian site and prepend with "c"
    if (input.length === 4) {
      obs.setSite(input);
    } else if (input.length === 3) {
      obs.setSite("c" + input);
    } else if (input.length === 2) {
      obs.setSite("cy" + input);
    }
  }

  return (
    <>
      <div className="flex justify-around bg-neutral-800 text-white p-2">
        <div className="flex place-items-center">
          <label htmlFor="site" className="text-white flex place-items-center">
            <Search className="w-4 h-4 me-2 inline" />
            <span>Site:</span>
          </label>
          <Input
            id="site"
            type="text"
            minLength={2}
            maxLength={4}
            className="ms-2 w-24 text-black text-center text-base uppercase rounded-e-none font-mono"
            autoComplete="false"
            spellCheck="false"
            defaultValue={obs.site}
            onChange={(e) => (siteId.current = e.currentTarget.value)}
            onKeyDown={(e) => (e.key === "Enter" ? handleInputText(e.currentTarget.value) : "")}
            onClick={(e) => (e.currentTarget.value = "")}
            autoFocus={true}
          />
          <Button
            className="me-2 rounded-e-md rounded-s-none flex place-items-center"
            variant={"secondary"}
            onClick={() => handleInputText(siteId.current)}
          >
            <RefreshCw className="w-4 h-4 me-2 inline" />
            Load
          </Button>
          <Select onValueChange={(e) => obs.setHours(parseInt(e))} defaultValue={obs.hours.toString()}>
            <SelectTrigger className="text-black">
              <SelectValue placeholder={obs.hours + " hrs"} />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((h, i) => (
                <SelectItem key={i} value={h.toString()}>
                  {h} hrs
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-y-scroll" style={{ height: "calc(100svh - 6.5rem)" }}>
        <METARs site={obs.site} data={metarData} fetchStatus={metarFetchStatus} />
        <SiteMetadata site={obs.site} data={metaData} fetchStatus={metaFetchStatus} />
        <TAF site={obs.site} data={tafData} fetchStatus={tafFetchStatus} />
      </div>
    </>
  );
}
