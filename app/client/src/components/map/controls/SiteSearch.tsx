import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { api } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { useMap } from "react-map-gl/maplibre";

export function SiteSearch() {
  const map = useMap().current;

  const [searchSite, setSearchSite] = useState<string>("");
  const [searchHasError, setSearchHasError] = useState<boolean>(false);

  const { data } = useQuery(
    api.alpha.sitedata.queryOptions({ site: searchSite }, { enabled: searchSite.length >= 3, retry: false }),
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
      // Unfocus if on mobile
      if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        e.currentTarget.blur();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget.value.toUpperCase();

    if (input.length < 3) return;

    setSearchSite(input.length === 3 ? `C${input}` : input);
    setSearchHasError(false);
  };

  const handleSearch = () => {
    if (data === undefined || data === null) {
      setSearchHasError(true);
    } else {
      map?.easeTo({ center: [data.rawLon, data.rawLat] });
      setSearchHasError(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="floating"
          aria-label={"Search for a site and centre the map"}
          title={"Search for a site and centre the map"}
        >
          <Search />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`flex flex-row gap-0 text-center items-center bg-neutral-950 w-fit p-0`} side="right">
        <Label htmlFor="map-site-search" className="text-white mx-2">
          Site ID:
        </Label>
        <div className="flex items-center col-span-2">
          <Input
            id="map-site-search"
            defaultValue={""}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={4}
            className="w-24 text-black text-center text-base uppercase rounded-e-none font-mono"
          />
          <Button
            size="icon"
            variant={searchHasError ? "destructive" : "default"}
            className="rounded-s-none"
            onClick={handleSearch}
            aria-label={"Search for a site and centre the map"}
            title={"Search for a site and centre the map"}
          >
            {searchHasError ? <ThumbsDown /> : <ArrowUpRight />}
          </Button>
        </div>
        {/* {searchHasError && (
          <div className="bg-red-800 text-white text-center h-10 px-2 rounded-e-lg flex items-center font-bold">
            Not found
          </div>
        )} */}
      </PopoverContent>
    </Popover>
  );
}
