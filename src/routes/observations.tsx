import METARs from "@/components/METARs";
import SiteMetadata from "@/components/SiteMetadata";
import TAF from "@/components/TAF";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObservationsContext } from "@/contexts/observationsContext";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/observations")({
  component: ObsComponent,
});

function ObsComponent() {
  // store the input state so we can validate it before we pass it
  const [inputText, setInputText] = useState<string>("");

  // use a context to store state so that when we come back to this tab it restores our obs/taf search
  const obs = useObservationsContext();

  // hours that are available as options in the dropdown list
  const HOURS: number[] = [6, 12, 18, 24, 36, 48, 96];

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
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? handleInputText(inputText) : "")}
            onClick={(e) => (e.currentTarget.value = "")}
            autoFocus={true}
          />
          <Button
            className="me-2 rounded-e-md rounded-s-none flex place-items-center"
            variant={"secondary"}
            onClick={() => handleInputText(inputText)}
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

      <METARs site={obs.site} hrs={obs.hours} />
      <SiteMetadata site={obs.site} />
      <TAF site={obs.site} />
    </>
  );
}
