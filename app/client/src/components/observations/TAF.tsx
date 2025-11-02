import type { ParsedTAF, TAFData } from "@/lib/types";
import { useHighlightSigWx } from "@/hooks/useHighlightSigWx";
import { formatSigWx } from "@/lib/utils";
import { AlertOctagon } from "lucide-react";

interface Props {
  data: TAFData | undefined;
}

const TAF = ({ data }: Props) => {
  const highlightSigWx = useHighlightSigWx().highlightSigWx;

  if (!data) return;
  const parsedTaf = data ? (formatSigWx(data, "taf") as ParsedTAF) : undefined;

  if (parsedTaf) {
    return (
      <div className="px-8 py-4 bg-muted text-black font-mono">
        <div>{highlightSigWx(parsedTaf.main)}</div>
        {parsedTaf.partPeriods &&
          parsedTaf.partPeriods.map((p, i) => (
            <div className={`ms-8 ${p.startsWith("FM") ? "-indent-6" : "-indent-4"}`} key={i}>
              {highlightSigWx(p)}
            </div>
          ))}
        <div>{parsedTaf.rmk}</div>
      </div>
    );
  } else {
    return (
      <div className="flex justify-center gap-2">
        <AlertOctagon />
        <span>No TAFs found</span>
      </div>
    );
  }
};

export default TAF;
