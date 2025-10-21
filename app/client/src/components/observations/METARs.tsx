import { OctagonAlert, Skull } from "lucide-react";
import { useEffect, useRef } from "react";
import { useHighlightSigWx } from "@/hooks/useHighlightSigWx";
import { APIResponse, METAR } from "@/lib/types";
import { formatSigWx } from "@/lib/utils";

interface Props {
  site: string;
  data: METAR | undefined;
}

const METARs = ({ site, data }: Props) => {
  const scrollTargetRef = useRef<null | HTMLDivElement>(null);
  const highlightSigWx = useHighlightSigWx().highlightSigWx;

  useEffect(() => {
    scrollTargetRef.current?.scrollIntoView({ behavior: "instant" });
  }, [data]);

  // if we have no data object, return nothing
  if (!data) return;

  const parsedMetars = data ? (data.map((m) => formatSigWx(m, "metar")) as string[]) : undefined;

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
};

export default METARs;
