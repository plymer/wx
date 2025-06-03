import { OctagonAlert, Skull } from "lucide-react";
import { useEffect, useRef } from "react";
import { useHighlightSigWx } from "@/hooks/useHighlightSigWx";
import { APIResponse, METAR } from "@/lib/types";
import { formatSigWx } from "@/lib/utils";

interface Props {
  site: string;
  data: APIResponse<METAR> | undefined;
}

const METARs = ({ site, data }: Props) => {
  // if we have no data object, return nothing
  if (!data) return;

  const scrollTargetRef = useRef<null | HTMLDivElement>(null);

  const parsedMetars =
    data.status === "success" ? (data.data.map((m) => formatSigWx(m, "metar")) as string[]) : undefined;

  const highlightSigWx = useHighlightSigWx().highlightSigWx;

  useEffect(() => {
    scrollTargetRef.current?.scrollIntoView({ behavior: "instant" });
  }, [data]);

  // return the JSX elements
  switch (data.status) {
    case "noData":
      return (
        <div className="px-6 py-2 bg-muted">
          <OctagonAlert className="inline" /> No METARs available for '{site.toUpperCase()}'
        </div>
      );
    case "error":
      return (
        <div className="px-6 py-2 bg-neutral-800 text-destructive">
          <Skull className="inline" /> {data.message || "There was an unknown error"}
        </div>
      );
    case "success":
      if (parsedMetars) {
        return (
          <div>
            {parsedMetars.map((m: string, i: number) => (
              <div className="font-mono px-6 odd:bg-muted even:bg-muted-foreground ps-10 -indent-8" key={i}>
                {highlightSigWx(m)}
              </div>
            ))}
            <div ref={scrollTargetRef}></div>
          </div>
        );
      }
  }
};

export default METARs;
