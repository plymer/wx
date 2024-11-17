import useAPI from "@/hooks/useAPI";
import { OtherChartData } from "@/lib/types";
import { useEffect, useState } from "react";

import { useAviationContext } from "@/contexts/aviationContext";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

const AvChartsOther = () => {
  const [domainList, setDomainList] = useState<string[]>([]);
  const [data, setData] = useState<OtherChartData[] | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const charts = useAviationContext();

  const { data: lgfData, isLoading: lgfIsLoading, error: lgfError } = useAPI<OtherChartData[]>(`charts/lgf`, []);
  const { data: hltData, isLoading: hltIsLoading, error: hltError } = useAPI<OtherChartData[]>(`charts/hlt`, []);
  const {
    data: sigwxData,
    isLoading: sigwxIsLoading,
    error: sigwxError,
  } = useAPI<OtherChartData[]>(`charts/sigwx`, []);

  const LGF_DOMAINS = ["lgfzvr41", "lgfzvr42", "lgfzvr43"];
  const HLT_DOMAINS = ["canada", "north_atlantic"];
  const SIGWX_DOMAINS = ["canada", "atlantic"];

  useEffect(() => {
    console.log("data:", data, "isLoading:", isLoading, "error message:", error?.message);
    switch (charts.product) {
      case "lgf":
        setData(lgfData);
        setIsLoading(lgfIsLoading && hltIsLoading && sigwxIsLoading);
        setError(lgfError);
        setDomainList(LGF_DOMAINS);
        charts.setDomain(LGF_DOMAINS[0]);
        charts.setTimeStep(0);
        charts.setTimeDelta(3);
        break;
      case "hlt":
        setData(hltData);
        setIsLoading(lgfIsLoading && hltIsLoading && sigwxIsLoading);
        setError(hltError);
        setDomainList(HLT_DOMAINS);
        charts.setDomain(HLT_DOMAINS[0]);
        charts.setTimeStep(0);
        charts.setTimeDelta(12);
        break;
      case "sigwx":
        setData(sigwxData);
        setIsLoading(lgfIsLoading && hltIsLoading && sigwxIsLoading);
        setError(sigwxError);
        setDomainList(SIGWX_DOMAINS);
        charts.setDomain(SIGWX_DOMAINS[0]);
        charts.setTimeStep(0);
        charts.setTimeDelta(12);
        break;
    }
  }, [charts.product, lgfIsLoading, hltIsLoading, sigwxIsLoading]);

  useEffect(() => {
    if (data) {
      // console.log(data);
      //@ts-ignore
      data.forEach((d) => (d.domain === charts.domain ? charts.setUrl(d.images[charts.timeStep]) : ""));
    }
  }, [charts.product, charts.domain, charts.timeStep, data]);

  return (
    <>
      <nav className="md:px-2 max-md:pt-2 max-md:flex max-md:flex-wrap max-md:justify-center">
        <label className="me-4 max-md:hidden">Domain:</label>
        {domainList.map((d, i) => (
          <Button
            variant={charts.domain === d ? "selected" : "secondary"}
            className="rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md"
            key={i}
            onClick={() => {
              charts.setDomain(d);
            }}
          >
            {d.toUpperCase()}
          </Button>
        ))}
      </nav>
      {error ? <div className="p-2">There was an error loading the image data</div> : ""}

      {data ? (
        <nav className="px-2 mt-2 flex max-md:justify-around place-items-center">
          <label className="me-4">Forecasts:</label>
          <div>
            {data.map((p) =>
              p.domain === charts.domain
                ? p.images.map((u, i) => (
                    <Button
                      className="rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
                      variant={charts.timeStep === i ? "selected" : "secondary"}
                      key={i}
                      value={u}
                      onClick={() => {
                        charts.setTimeStep(i);
                      }}
                    >
                      T+
                      {i *
                        (charts.product === "sigwx" && charts.domain === "canada"
                          ? charts.timeDelta / 2
                          : charts.timeDelta)}
                    </Button>
                  ))
                : "",
            )}
          </div>
        </nav>
      ) : (
        <div>
          <Loader2 className="inline animate-spin me-2" />
          Loading...
        </div>
      )}
    </>
  );
};

export default AvChartsOther;
