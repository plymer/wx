import { Button } from "@/components/ui/button";
import useAPI from "@/hooks/useAPI";
import { GFAData, OtherChartData } from "@/lib/types";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/aviation")({
  component: AviationComponent,
});

function AviationComponent() {
  const [category, setCategory] = useState("gfa");
  const [product, setProduct] = useState("gfacn32");
  const [subProduct, setSubProduct] = useState("cldwx");
  const [timeStep, setTimeStep] = useState<number>(0);
  const [url, setURL] = useState<string>();

  const { data, isLoading, fetchStatus, error } =
    category === "gfa" ? useAPI<GFAData[]>("charts/gfa", []) : useAPI<OtherChartData[]>(`charts/${category}`, []);

  const CATEGORIES = ["gfa", "lgf", "hlt", "sigwx"];

  useEffect(() => {
    if (data && category === "gfa") {
      const gfas = data as GFAData[];
      //@ts-ignore
      gfas.forEach((d) => (d.domain === product ? setURL(d[subProduct][timeStep]) : ""));
    } else if (data && category !== "gfa") {
      // these have a different data structure
    }
  }, [category, product, subProduct, timeStep, fetchStatus]);

  if (category === "gfa") {
    const gfas = data as GFAData[];

    const GFA_REGIONS = ["GFA 31", "GFA 32", "GFA 33", "GFA 34", "GFA 35", "GFA 36", "GFA 37"];

    return (
      <div className="bg-neutral-800 text-white p-2">
        <nav>
          {CATEGORIES.map((c, i) => (
            <Button variant={"secondary"} key={i} onClick={() => setCategory(c)}>
              {c.toUpperCase()}
            </Button>
          ))}
        </nav>
        <nav>
          {GFA_REGIONS.map((r, i) => (
            <Button key={i} onClick={() => setProduct("gfacn3" + (i + 1).toString())}>
              {r}
            </Button>
          ))}
        </nav>
        {!data && !isLoading && error ? <div>There was an error loading the image data</div> : ""}
        <nav>
          <label>Clouds & Wx</label>
          {gfas?.map((p) =>
            p.domain === product
              ? p.cldwx.map((u, i) => (
                  <Button
                    key={i}
                    value={u}
                    onClick={() => {
                      setSubProduct("cldwx");
                      setTimeStep(i);
                    }}
                  >
                    T+{i * 6}
                  </Button>
                ))
              : "",
          )}
        </nav>
        <nav>
          <label>Turbulence & Icing</label>
          {gfas?.map((p) =>
            p.domain === product
              ? p.turbc.map((u, i) => (
                  <Button
                    key={i}
                    onClick={() => {
                      setSubProduct("turbc");
                      setTimeStep(i);
                      setURL(u);
                    }}
                  >
                    T+{i * 6}
                  </Button>
                ))
              : "",
          )}
        </nav>
        <img className="max-w-full" src={url} />
      </div>
    );
  } else {
    return (
      <div className="bg-neutral-800 text-white p-2">
        <nav>
          {CATEGORIES.map((c, i) => (
            <Button variant={"secondary"} key={i} onClick={() => setCategory(c)}>
              {c.toUpperCase()}
            </Button>
          ))}
        </nav>
        <div>This hasn't been implemented yet, sorry!</div>
      </div>
    );
  }
}
