import useAPI from "@/hooks/useAPI";
import { OtherChartData } from "@/lib/types";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

interface Props {
  category: string;
}

const AvChartsOther = ({ category }: Props) => {
  const [product, setProduct] = useState<string>(category);
  const [domainList, setDomainList] = useState<string[]>([]);
  const [domain, setDomain] = useState<string>(domainList[0]);
  const [timeDelta, setTimeDelta] = useState<number>(3);
  const [timeStep, setTimeStep] = useState<number>(0);
  const [URL, setURL] = useState<string>("");

  const { data, isLoading, error } = useAPI<OtherChartData[]>(`charts/${category}`, []);

  // const DOMAINS = ["lgfzvr41", "lgfzvr42", "lgfzvr43", "canada", "north_atlantic", "atlantic"];
  const LGF_DOMAINS = ["lgfzvr41", "lgfzvr42", "lgfzvr43"];
  const HLT_DOMAINS = ["canada", "north_atlantic"];
  const SIGWX_DOMAINS = ["canada", "atlantic"];

  useEffect(() => {
    setProduct(category);
    switch (category) {
      case "lgf":
        setDomainList(LGF_DOMAINS);
        setDomain(LGF_DOMAINS[0]);
        setTimeStep(0);
        setTimeDelta(3);
        break;
      case "hlt":
        setDomainList(HLT_DOMAINS);
        setDomain(HLT_DOMAINS[0]);
        setTimeStep(0);
        setTimeDelta(12);
        break;
      case "sigwx":
        setDomainList(SIGWX_DOMAINS);
        setDomain(SIGWX_DOMAINS[0]);
        setTimeStep(0);
        setTimeDelta(12);
        break;
    }
  }, [category]);

  useEffect(() => {
    if (data) {
      // console.log(data);
      //@ts-ignore
      data.forEach((d) => (d.domain === domain ? setURL(d.images[timeStep]) : ""));
    }
  }, [category, domain, product, timeStep, data]);

  return (
    <>
      <nav className="md:px-2 max-md:pt-2 max-md:flex max-md:flex-wrap max-md:justify-center">
        <label className="me-4 max-md:hidden">Domain:</label>
        {domainList.map((d, i) => (
          <Button
            variant={domain === d ? "selected" : "secondary"}
            className="rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md"
            key={i}
            onClick={() => {
              setDomain(d);
              // console.log(d);
              // console.log(product, domain, domainList, timeStep, timeDelta);
            }}
          >
            {d.toUpperCase()}
          </Button>
        ))}
      </nav>
      {!data && !isLoading && error ? <div className="p-2">There was an error loading the image data</div> : ""}
      <nav className="px-2 mt-2 flex max-md:justify-around place-items-center">
        <label className="me-4">Forecasts:</label>
        <div>
          {data?.map((p) =>
            p.domain === domain
              ? p.images.map((u, i) => (
                  <Button
                    className="rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
                    variant={timeStep === i ? "selected" : "secondary"}
                    key={i}
                    value={u}
                    onClick={() => {
                      setTimeStep(i);
                    }}
                  >
                    T+{i * (product === "sigwx" && domain === "canada" ? timeDelta / 2 : timeDelta)}
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

export default AvChartsOther;
