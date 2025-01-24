// custom hooks
import useAPI from "@/hooks/useAPI";

// custom types
import { GFAData, OtherChartData } from "@/lib/types";

// ui components
import { Button } from "@/components/ui/button";

// stateStores
import { useAviation } from "@/stateStores/aviation";

// child components
import AvChartsGFA from "@/components/aviation/AvChartsGFA";
import AvChartsOther from "@/components/aviation/AvChartsOther";
import { Products } from "@/config/aviationProducts";
// import AvImageContainer from "@/components/aviation/AvImageContainer";
// import HubDiscussion from "@/components/aviation/HubDiscussion";

export const PRODUCTS = ["gfa", "lgf", "hlt", "sigwx"];

export default function Aviation() {
  const product = useAviation((state) => state.product);
  const setProduct = useAviation((state) => state.setProduct);

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
              variant={product === c ? "selected" : "secondary"}
              key={i}
              onClick={() => setProduct(c as Products)}
            >
              {c.toUpperCase()}
            </Button>
          ))}
        </nav>

        {/* gfa section */}
        {product === "gfa" && <AvChartsGFA data={gfaData} fetchStatus={gfaFetching} />}

        {/* lgf section */}
        {product === "lgf" && <AvChartsOther product={product} data={lgfData} fetchStatus={lgfFetchStatus} />}

        {/* hlt section */}
        {product === "hlt" && <AvChartsOther product={product} data={hltData} fetchStatus={hltFetchStatus} />}

        {/* sigwx section */}
        {product === "sigwx" && <AvChartsOther product={product} data={sigwxData} fetchStatus={sigwxFetchStatus} />}

        {/* hub discussion section */}
        {/* {product === "hubs" && <HubDiscussion />} */}

        {/* the image container used to show all of the charts section */}
        {/* {product !== "hubs" && <AvImageContainer url={aviation.url} />} */}
      </div>
    </>
  );
}
