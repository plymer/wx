// third-party libraries
import { useRef } from "react";
import { RefreshCw, Search } from "lucide-react";
import { useHours, useObsActions, useSite } from "../stateStores/observations";
import useAPI from "../hooks/useAPI";
import { METAR, ParsedTAF, SiteData, TAFData } from "../lib/types";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import METARs from "./observations/METARs";
import SiteMetadata from "./observations/SiteMetadata";
import TAF from "./observations/TAF";
import { useHighlightSigWx } from "../hooks/useHighlightSigWx";
import { formatSigWx } from "../lib/utils";
import Button from "./ui/button";

export default function Observations() {
  // create a ref to the siteId text input
  const siteId = useRef("");

  // use a context to store state so that when we come back to this tab it restores our obs/taf search
  const actions = useObsActions();
  const site = useSite();
  const hours = useHours();

  // hours that are available as options in the dropdown list
  const HOURS: number[] = [6, 12, 18, 24, 36, 48, 96];

  // fetch all data within the route and then pass it to the child components for each data type
  const { data: metarData, fetchStatus: metarFetchStatus } = useAPI<METAR>("/alpha/metars", {
    site: site,
    hrs: hours,
  });

  const { data: metaData, fetchStatus: metaFetchStatus } = useAPI<SiteData>("/alpha/sitedata", { site: site });

  const { data: tafData, fetchStatus: tafFetchStatus } = useAPI<TAFData>("/alpha/taf", { site: site });

  const parsedMetars =
    metarData && metarData.data && (metarData.data.metars.map((m) => formatSigWx(m, "metar")) as string[]);
  const parsedTaf = tafData && tafData.data && (formatSigWx(tafData.data.taf, "taf") as ParsedTAF);

  // validate the input and mutate the search string, passing it to the context and then it will propagate to the child components
  //   to show the user the data they have requested
  function handleInputText(input: string) {
    // we want to allow 2, 3, and 4-letter idents to be used
    // for 2-letter idents, assume we are doing a major canadian site and prepend with "cy"
    // for 3-letter idents, assume we are doing a canadian site and prepend with "c"
    if (input.length === 4) {
      actions.setSite(input);
    } else if (input.length === 3) {
      actions.setSite("c" + input);
    } else if (input.length === 2) {
      actions.setSite("cy" + input);
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
            autoComplete="off"
            autoCorrect="false"
            spellCheck="false"
            defaultValue={site}
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
          <Select onValueChange={(e) => actions.setHours(parseInt(e))} defaultValue={hours.toString()}>
            <SelectTrigger className="text-black">
              <SelectValue placeholder={hours + " hrs"} />
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
        {metarData && <METARs site={site} data={parsedMetars} fetchStatus={metarFetchStatus} />}
        {metaData && <SiteMetadata site={site} data={metaData.data} fetchStatus={metaFetchStatus} />}
        {tafData && <TAF site={site} data={parsedTaf} fetchStatus={tafFetchStatus} />}
      </div>
    </>
  );
}
