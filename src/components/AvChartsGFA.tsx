import { useEffect, useState } from "react";

import useAPI from "@/hooks/useAPI";
import { GFAData } from "@/lib/types";
import { Button } from "./ui/button";

const AvChartsGFA = () => {
  const [region, setRegion] = useState("gfacn32");
  const [product, setProduct] = useState<"cldwx" | "turbc">("cldwx");
  const [timeStep, setTimeStep] = useState<number>(0);
  const [URL, setURL] = useState<string>("");

  const { data, isLoading, error } = useAPI<GFAData[]>("charts/gfa", []);

  const GFA_REGIONS = ["gfacn31", "gfacn32", "gfacn33", "gfacn34", "gfacn35", "gfacn36", "gfacn37"];

  useEffect(() => {
    if (data) {
      //@ts-ignore
      data.forEach((d) => (d.domain === region ? setURL(d[product][timeStep]) : ""));
    }
  }, [region, product, timeStep, data]);

  return (
    <>
      <nav className="md:px-2 max-md:pt-2 max-md:flex max-md:flex-wrap max-md:justify-center">
        <label className="me-4 max-md:hidden">Region:</label>
        {GFA_REGIONS.map((r, i) => (
          <Button
            variant={region === r ? "selected" : "secondary"}
            className="rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md"
            key={i}
            onClick={() => setRegion("gfacn3" + (i + 1).toString())}
          >
            {r.replace("gfacn", "gfa ").toUpperCase()}
          </Button>
        ))}
      </nav>
      {!data && !isLoading && error ? <div className="p-2">There was an error loading the image data</div> : ""}
      <nav className="px-2 mt-2 flex max-md:justify-around place-items-center">
        <label className="me-4">Clouds & Weather:</label>
        <div>
          {data?.map((p) =>
            p.domain === region
              ? p.cldwx.map((u, i) => (
                  <Button
                    className="rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
                    variant={product === "cldwx" && timeStep === i ? "selected" : "secondary"}
                    key={i}
                    value={u}
                    onClick={() => {
                      setProduct("cldwx");
                      setTimeStep(i);
                    }}
                  >
                    T+{i * 6}
                  </Button>
                ))
              : "",
          )}
        </div>
      </nav>
      <nav className="px-2 mt-2 flex max-md:justify-around place-items-center">
        <label className="me-4">Turbulence & Icing:</label>
        <div>
          {data?.map((p) =>
            p.domain === region
              ? p.turbc.map((u, i) => (
                  <Button
                    variant={product === "turbc" && timeStep === i ? "selected" : "secondary"}
                    className="rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
                    key={i}
                    value={u}
                    onClick={() => {
                      setProduct("turbc");
                      setTimeStep(i);
                    }}
                  >
                    T+{i * 6}
                  </Button>
                ))
              : "",
          )}
        </div>
      </nav>

      <img className="max-w-full mx-auto px-2 mt-2 pb-2" src={URL} />
    </>
  );
};

export default AvChartsGFA;
