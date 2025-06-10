import { OctagonAlert, Skull } from "lucide-react";
import { ParsedTAF, TAFData } from "@/lib/types";
import { useHighlightSigWx } from "@/hooks/useHighlightSigWx";
import { APIResponse } from "@/lib/types";
import { formatSigWx } from "@/lib/utils";

interface Props {
  site: string;
  data: APIResponse<TAFData> | undefined;
}

const TAF = ({ site, data }: Props) => {
  const highlightSigWx = useHighlightSigWx().highlightSigWx;

  if (!data) return;
  const parsedTaf = data.status === "success" ? (formatSigWx(data.data, "taf") as ParsedTAF) : undefined;

  switch (data.status) {
    case "noData":
      return (
        <div className="px-6 py-2 bg-muted text-black">
          <OctagonAlert className="inline" /> No TAF available for '{site.toUpperCase()}'
        </div>
      );
    case "error":
      return (
        <div className="px-6 py-2 bg-muted text-black">
          <Skull className="inline" /> {data.message || "There was an unknown error"}
        </div>
      );
    case "success":
      if (parsedTaf) {
        return (
          <div className="px-8 py-4 bg-muted text-black font-mono">
            <div>{highlightSigWx(parsedTaf.main)}</div>
            {parsedTaf.partPeriods &&
              parsedTaf.partPeriods.map((p, i) => (
                <div className="ms-8 -indent-4" key={i}>
                  {highlightSigWx(p)}
                </div>
              ))}
            <div>{parsedTaf.rmk}</div>
          </div>
        );
      }
  }
};

export default TAF;
