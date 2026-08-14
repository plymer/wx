import { useEffect, useRef } from "react";
import { SigWx } from "@/components/observations/SigWx";
import { convertMetarWinds, formatSigWx } from "@/lib/utils";
import { AlertOctagon } from "lucide-react";
import { useUnits } from "@/stateStores/observations";

interface Props {
  data: string[] | undefined;
}

const METARs = ({ data }: Props) => {
  const scrollTargetRef = useRef<null | HTMLDivElement>(null);
  const units = useUnits();

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
            <SigWx text={convertMetarWinds(m, units)} />
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
