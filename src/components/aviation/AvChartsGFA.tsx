import { useEffect } from "react";

import { GFAData } from "@/lib/types";
import { Button } from "../ui/button";
import { useAviationContext } from "@/contexts/aviationContext";
import { Loader2 } from "lucide-react";

interface Props {
  data: GFAData[] | undefined;
  fetchStatus: string;
}

const AvChartsGFA = ({ data, fetchStatus }: Props) => {
  const gfa = useAviationContext();

  const GFA_REGIONS = ["gfacn31", "gfacn32", "gfacn33", "gfacn34", "gfacn35", "gfacn36", "gfacn37"];

  useEffect(() => {
    if (data) {
      //@ts-ignore
      data.forEach((d) => (d.domain === gfa.gfaDomain ? gfa.setUrl(d[gfa.subProduct][gfa.gfaTimeStep]) : ""));
    }
  }, [gfa.gfaDomain, gfa.subProduct, gfa.gfaTimeStep, data]);

  if (fetchStatus !== "idle") {
    return (
      <div className="px-6 py-2 min-h-22 max-h-96">
        <Loader2 className="inline animate-spin" /> Loading GFA Data...
      </div>
    );
  }

  return (
    <>
      <nav className="md:px-2 max-md:pt-2 max-md:flex max-md:flex-wrap max-md:justify-center">
        <label className="me-4 max-md:hidden">Domain:</label>
        {GFA_REGIONS.map((r, i) => (
          <Button
            variant={gfa.gfaDomain === r ? "selected" : "secondary"}
            className="rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md"
            key={i}
            onClick={() => gfa.setGfaDomain("gfacn3" + (i + 1).toString())}
          >
            {r.replace("gfacn", "gfa ").toUpperCase()}
          </Button>
        ))}
      </nav>
      {data && (
        <>
          <nav className="px-2 mt-2 flex max-md:justify-around place-items-center">
            <label className="me-4">Clouds & Weather:</label>
            <div>
              {data?.map(
                (p) =>
                  p.domain === gfa.gfaDomain &&
                  p.cldwx.map((u, i) => (
                    <Button
                      className="rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
                      variant={gfa.subProduct === "cldwx" && gfa.gfaTimeStep === i ? "selected" : "secondary"}
                      key={i}
                      value={u}
                      onClick={() => {
                        gfa.setSubProduct!("cldwx");
                        gfa.setGfaTimeStep(i);
                      }}
                    >
                      T+{i * 6}
                    </Button>
                  )),
              )}
            </div>
          </nav>
          <nav className="px-2 mt-2 flex max-md:justify-around place-items-center">
            <label className="me-4">Turbulence & Icing:</label>
            <div>
              {data?.map((p) =>
                p.domain === gfa.gfaDomain
                  ? p.turbc.map((u, i) => (
                      <Button
                        variant={gfa.subProduct === "turbc" && gfa.gfaTimeStep === i ? "selected" : "secondary"}
                        className="rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
                        key={i}
                        value={u}
                        onClick={() => {
                          gfa.setSubProduct!("turbc");
                          gfa.setGfaTimeStep(i);
                        }}
                      >
                        T+{i * 6}
                      </Button>
                    ))
                  : "",
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
};

export default AvChartsGFA;
