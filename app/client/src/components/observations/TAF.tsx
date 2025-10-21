import { ParsedTAF, TAFData } from "@/lib/types";
import { useHighlightSigWx } from "@/hooks/useHighlightSigWx";
import { formatSigWx } from "@/lib/utils";

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
  }
};

export default TAF;
