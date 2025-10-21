import useAPI from "@/hooks/useAPI";
import { GFAData, OtherChartData, Products } from "@/lib/types";
import { useAviationActions, useHub, useAvProduct } from "@/stateStores/aviation";
import AvChartsGFA from "./aviation/AvChartsGFA";
import AvChartsOther from "./aviation/AvChartsOther";
import HubDiscussion from "./aviation/HubDiscussion";
import Button from "./ui/Button";
import { PRODUCTS } from "@/config/aviationProducts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";

export default function Aviation() {
  const product = useAvProduct();
  const hub = useHub();
  const actions = useAviationActions();

  const { data: gfaData } = useQuery(api.charts.gfa.queryOptions());
  const { data: lgfData } = useQuery(api.charts.lgf.queryOptions());
  const { data: hltData } = useQuery(api.charts.hlt.queryOptions());
  const { data: sigwxData } = useQuery(api.charts.sigwx.queryOptions());

  return (
    <>
      <div className="bg-neutral-800 text-white min-h-(--max-avn-height) max-md:min-h-(--md-avn-height)">
        <nav className="md:p-2 max-md:pt-2">
          <label className="me-2 max-md:hidden">Product:</label>
          {PRODUCTS.map((c, i) => (
            <Button
              className={`${
                product === c ? "active" : ""
              } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/5`}
              key={i}
              onClick={() => actions.setProduct(c as Products)}
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
