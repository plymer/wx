// third-party libraries
import { createFileRoute } from "@tanstack/react-router";

// custom hooks
import useAPI from "@/hooks/useAPI";

// custom types
import { GFAData, OtherChartData } from "@/lib/types";

// ui components
import { Button } from "@/components/ui/button";

// context
import { useAviationContext } from "@/contexts/aviationContext";

// child components
import AvChartsGFA from "@/components/aviation/AvChartsGFA";
import AvChartsOther from "@/components/aviation/AvChartsOther";
import AvImageContainer from "@/components/aviation/AvImageContainer";
import HubDiscussion from "@/components/aviation/HubDiscussion";

// export the route for the router
export const Route = createFileRoute("/aviation")({
  component: AviationComponent,
});

export const PRODUCTS = ["gfa", "lgf", "hlt", "sigwx", "hubs"];

function AviationComponent() {
  const aviation = useAviationContext();

  const { data: gfaData, fetchStatus: gfaFetching } = useAPI<GFAData[]>("charts/gfa", []);
  const { data: lgfData, fetchStatus: lgfFetchStatus } = useAPI<OtherChartData[]>(`charts/lgf`, []);
  const { data: hltData, fetchStatus: hltFetchStatus } = useAPI<OtherChartData[]>(`charts/hlt`, []);
  const { data: sigwxData, fetchStatus: sigwxFetchStatus } = useAPI<OtherChartData[]>(`charts/sigwx`, []);

  return (
    <>
      <div className="bg-neutral-800 text-white ">
        <nav className="md:p-2 max-md:pt-2">
          <label className="me-2 max-md:hidden">Product:</label>
          {PRODUCTS.map((c, i) => (
            <Button
              className="rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/5"
              variant={aviation.product === c ? "selected" : "secondary"}
              key={i}
              onClick={() => aviation.setProduct(c)}
            >
              {c.toUpperCase()}
            </Button>
          ))}
        </nav>

        {/* gfa section */}
        {aviation.product === "gfa" && <AvChartsGFA data={gfaData} fetchStatus={gfaFetching} />}

        {/* lgf section */}
        {aviation.product === "lgf" && <AvChartsOther data={lgfData} fetchStatus={lgfFetchStatus} />}

        {/* hlt section */}
        {aviation.product === "hlt" && <AvChartsOther data={hltData} fetchStatus={hltFetchStatus} />}

        {/* sigwx section */}
        {aviation.product === "sigwx" && <AvChartsOther data={sigwxData} fetchStatus={sigwxFetchStatus} />}

        {/* hub discussion section */}
        {aviation.product === "hubs" && <HubDiscussion />}

        {/* the image container used to show all of the charts section */}
        {aviation.product !== "hubs" && aviation.url !== "" && <AvImageContainer url={aviation.url} />}
      </div>
    </>
  );
}
