// third-party libraries
import { useEffect, useRef } from "react";
import { Plane, RefreshCw, User } from "lucide-react";
import { toast } from "sonner";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useHours, useObsActions, useSite, useUnits } from "@/stateStores/observations";

import { Input } from "./ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select";
import METARs from "./observations/METARs";
import SiteMetadata from "./observations/SiteMetadata";
import TAF from "./observations/TAF";
import Button from "./ui/Button";
import { api } from "@/lib/trpc";
import { MINUTE } from "@shared/lib/constants";

export default function Observations() {
  // create a refs to the siteId text input and the input debounce timeout
  const siteId = useRef("");

  // use a context to store state so that when we come back to this tab it restores our obs/taf search
  const actions = useObsActions();
  const site = useSite();
  const hours = useHours();
  const units = useUnits();

  // when we mount the component, we want to set the siteId to the current site
  useEffect(() => {
    siteId.current = site;
    return () => {
      siteId.current = "";
    };
  }, []); // this needs to only run on mount/unmount

  // hours that are available as options in the dropdown list
  const HOURS: number[] = [6, 12, 18, 24, 36, 48, 96];

  // fetch all data within the route and then pass it to the child components for each data type

  const { data: metarData, fetchStatus: metarFetchStatus } = useQuery(
    api.alpha.metars.queryOptions(
      { site: site, hrs: hours },
      { placeholderData: keepPreviousData, refetchInterval: MINUTE },
    ),
  );

  const { data: metaData, fetchStatus: metaFetchStatus } = useQuery(
    api.alpha.sitedata.queryOptions({ site: site }, { placeholderData: keepPreviousData, refetchInterval: MINUTE }),
  );

  const { data: tafData, fetchStatus: tafFetchStatus } = useQuery(
    api.alpha.taf.queryOptions({ site: site }, { placeholderData: keepPreviousData, refetchInterval: MINUTE }),
  );

  const isLoading = metarFetchStatus === "fetching" || tafFetchStatus === "fetching" || metaFetchStatus === "fetching";

  // validate the input and mutate the search string, passing it to the context and then it will propagate to the child components
  //   to show the user the data they have requested
  const handleInputText = (input: string) => {
    // we want to allow 2, 3, and 4-letter idents to be used
    // for 2-letter idents, assume we are doing a major canadian site and prepend with "cy"
    // for 3-letter idents, assume we are doing a canadian site and prepend with "c"

    if (input.length === 4) {
      actions.setSite(input);
    } else if (input.length === 3) {
      actions.setSite("c" + input);
    } else if (input.length === 2) {
      actions.setSite("cy" + input);
    } else {
      // we want to add a toast/popup here to inform the user that the input is invalid
      toast.error("Please enter a valid site ID (2-4 characters).", {
        position: "top-center",
        description: "If you are looking for Toronto, you can type 'YZ', 'YYZ', or 'CYYZ'.",
        duration: 2500,
        action: {
          label: "OK",
          onClick: () => toast.dismiss(),
        },
      });
    }
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    siteId.current = e.currentTarget.value;
  };

  const handleOnClick = () => handleInputText(siteId.current);

  const handleUnitClick = () => actions.toggleUnits();

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputText(siteId.current);
      // Unfocus if on mobile
      if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        e.currentTarget.blur();
      }
    }
  };

  return (
    <>
      <div className="flex justify-center gap-2 bg-neutral-800 text-white p-2 text-sm">
        <div className="flex items-center">
          <Input
            id="site"
            type="text"
            minLength={2}
            maxLength={4}
            // text-base is required so that the mobile experience doesn't zoom to the input
            className="w-24 text-black text-center text-base uppercase rounded-e-none font-mono"
            autoComplete="off"
            autoCorrect="false"
            spellCheck="false"
            defaultValue={site}
            onChange={(e) => handleOnChange(e)}
            onKeyDown={(e) => handleOnKeyDown(e)}
            onClick={(e) => (e.currentTarget.value = "")}
          />
          <Button
            className="rounded-e-md rounded-s-none flex items-center gap-2"
            onClick={() => handleOnClick()}
            variant="alternate"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            Load
          </Button>
        </div>

        <Select onValueChange={(e) => actions.setHours(parseInt(e))} defaultValue={hours.toString()}>
          <SelectTrigger className="text-black max-w-48">
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
        <Button variant="alternate" onClick={handleUnitClick}>
          {units === "aviation" ? <Plane /> : <User />}
        </Button>
      </div>

      <div className="overflow-y-scroll text-sm" style={{ height: "calc(100svh - 6.5rem)" }}>
        <METARs data={metarData} />
        <SiteMetadata response={metaData} />
        <TAF data={tafData} />
      </div>
    </>
  );
}
