import { Products } from "../config/aviationProducts";
import useAPI from "../hooks/useAPI";
import { GFAData, OtherChartData } from "../lib/types";
import { useAviation } from "../stateStores/aviation";
import AvChartsGFA from "./aviation/AvChartsGFA";
import AvChartsOther from "./aviation/AvChartsOther";
import HubDiscussion from "./aviation/HubDiscussion";
import Button from "./ui/button";

export const PRODUCTS = ["gfa", "lgf", "hlt", "sigwx", "hubs"];

export default function Aviation() {
  const product = useAviation((state) => state.product);
  const setProduct = useAviation((state) => state.setProduct);
  const hub = useAviation((state) => state.hub);

  const { data: gfaData, fetchStatus: gfaFetchStatus } = useAPI<GFAData[]>("/charts/gfa", {});
  const { data: lgfData, fetchStatus: lgfFetchStatus } = useAPI<OtherChartData[]>(`/charts/lgf`, {});
  const { data: hltData, fetchStatus: hltFetchStatus } = useAPI<OtherChartData[]>(`/charts/hlt`, {});
  const { data: sigwxData, fetchStatus: sigwxFetchStatus } = useAPI<OtherChartData[]>(`/charts/sigwx`, {});

  console.log(gfaFetchStatus, lgfFetchStatus, hltFetchStatus, sigwxFetchStatus);

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
        {product === "gfa" && <AvChartsGFA product={product} data={gfaData} />}

        {/* lgf section */}
        {product === "lgf" && <AvChartsOther product={product} data={lgfData} />}

        {/* hlt section */}
        {product === "hlt" && <AvChartsOther product={product} data={hltData} />}

        {/* sigwx section */}
        {product === "sigwx" && <AvChartsOther product={product} data={sigwxData} />}

        {/* hub discussion section */}
        {product === "hubs" && <HubDiscussion hub={hub} />}
      </div>
    </>
  );
}
