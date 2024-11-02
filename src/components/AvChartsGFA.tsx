import useAPI from "@/hooks/useAPI";
import { GFAData } from "@/lib/types";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import HubDiscussion from "./HubDiscussion";

const AvChartsGFA = () => {
  const [region, setRegion] = useState("gfacn32");
  const [product, setProduct] = useState<"cldwx" | "turbc">("cldwx");
  const [timeStep, setTimeStep] = useState<number>(0);
  const [URL, setURL] = useState<string>("");

  const { data, isLoading, error } = useAPI<GFAData[]>("charts/gfa", []);

  const GFA_REGIONS = ["GFA 31", "GFA 32", "GFA 33", "GFA 34", "GFA 35", "GFA 36", "GFA 37"];

  useEffect(() => {
    if (data) {
      //@ts-ignore
      data.forEach((d) => (d.domain === region ? setURL(d[product][timeStep]) : ""));
    }
  }, [region, product, timeStep]);

  return (
    <>
      <nav className="px-2">
        <label className="me-4">Region:</label>
        {GFA_REGIONS.map((r, i) => (
          <Button
            className="rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
            key={i}
            onClick={() => setRegion("gfacn3" + (i + 1).toString())}
          >
            {r}
          </Button>
        ))}
      </nav>
      {!data && !isLoading && error ? <div className="p-2">There was an error loading the image data</div> : ""}
      <nav className="px-2">
        <label className="me-4">Clouds & Wx</label>
        {data?.map((p) =>
          p.domain === region
            ? p.cldwx.map((u, i) => (
                <Button
                  className="rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
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
      </nav>
      <nav className="px-2">
        <label className="me-4">Turbulence & Icing</label>
        {data?.map((p) =>
          p.domain === region
            ? p.turbc.map((u, i) => (
                <Button
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
      </nav>
      <img className="max-w-full mx-auto px-2" src={URL} />
      <HubDiscussion />
    </>
  );
};

export default AvChartsGFA;
