import type { ParsedTAF } from "@/lib/types";
import { SigWx } from "@/components/observations/SigWx";
import { formatSigWx } from "@/lib/utils";
import { AlertOctagon } from "lucide-react";

interface Props {
  data: string | undefined;
}

const TAF = ({ data }: Props) => {
  if (!data) return;
  const parsedTaf = data ? (formatSigWx(data, "taf") as ParsedTAF) : undefined;

  if (parsedTaf) {
    return (
      <div className="px-8 py-4 bg-muted text-black font-mono">
        <div>
          <SigWx text={parsedTaf.main} />
        </div>
        {parsedTaf.partPeriods &&
          parsedTaf.partPeriods.map((p, i) => (
            <div className={`ms-8 ${p.startsWith("FM") ? "-indent-6" : "-indent-4"}`} key={i}>
              <SigWx text={p} />
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
