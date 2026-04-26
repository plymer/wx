import { useEffect, useRef } from "react";
import { useHighlightSigWx } from "@/hooks/useHighlightSigWx";
import { convertMetarWinds, formatSigWx } from "@/lib/utils";
import { AlertOctagon } from "lucide-react";
import { useUnits } from "@/stateStores/observations";

interface Props {
  data: string[] | undefined;
}

const METARs = ({ data }: Props) => {
  const scrollTargetRef = useRef<null | HTMLDivElement>(null);
  const units = useUnits();
  const { highlightSigWx } = useHighlightSigWx();

  useEffect(() => {
    scrollTargetRef.current?.scrollIntoView({ behavior: "instant" });
  }, [data]);

  // if we have no data object, return nothing
  if (!data) return;

  const parsedMetars = data
    ? (data.map((m) => formatSigWx(convertMetarWinds(m, units), "metar")) as string[])
    : undefined;

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
  } else {
    return (
      <div className="flex justify-center gap-2">
        <AlertOctagon />
        <span>No METARs found</span>
      </div>
    );
  }
};

export default METARs;
