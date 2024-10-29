import METARs from "@/components/METARs";
import SiteMetadata from "@/components/SiteMetadata";
import TAF from "@/components/TAF";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/observations")({
  component: ObsComponent,
});

function ObsComponent() {
  const [hours, setHours] = useState<number>(24);
  const [inputText, setInputText] = useState<string>("");
  const [site, setSite] = useState<string>("");

  const HOURS: number[] = [6, 12, 18, 24, 36, 48, 96];

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
            minLength={3}
            maxLength={4}
            defaultValue={inputText}
            className="ms-2 w-24 text-black text-center text-base uppercase rounded-e-none font-mono"
            autoComplete="false"
            spellCheck="false"
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? setSite(inputText) : "")}
          />
          <Button
            className="me-2 rounded-e-md rounded-s-none flex place-items-center"
            variant={"secondary"}
            onClick={() => setSite(inputText)}
          >
            <RefreshCw className="w-4 h-4 me-2 inline" />
            Load
          </Button>
          <Select onValueChange={(e) => setHours(parseInt(e))} defaultValue={"24"}>
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
      <METARs site={site} hrs={hours} />
      <SiteMetadata site={site} />
      <TAF site={site} />
    </>
  );
}
