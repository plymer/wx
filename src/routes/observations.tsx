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

  const HOURS: number[] = [6, 12, 18, 24, 36, 48, 96];

  return (
    <>
      <div className="flex justify-around bg-neutral-800 text-white p-2 rounded-t-md">
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
            className="ms-2 w-24 text-black text-center uppercase rounded-e-none font-mono"
            autoComplete="false"
            spellCheck="false"
          />
          <Button className="me-2 rounded-e-md rounded-s-none flex place-items-center" variant={"secondary"}>
            <RefreshCw className="w-4 h-4 me-2 inline" />
            Load
          </Button>
          <Select onValueChange={(e) => setHours(parseInt(e))}>
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
      <div>METARs go here</div>
      <div>Site Info goes here</div>
      <div>TAF goes here</div>
    </>
  );
}
