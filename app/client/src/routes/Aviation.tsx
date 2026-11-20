import { useAviationActions, useAvProduct, useTimeStep } from "@/stateStores/aviation";
import AvChartsGFA from "@/components/aviation/AvChartsGFA";
import AvChartsOther from "@/components/aviation/AvChartsOther";

import Button from "@/components/ui/Button";
import { AVIATION_PRODUCTS, GFA_PLACEHOLDER_DATA, PRODUCTS } from "@/config/aviationProducts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";

export default function Aviation() {
  const product = useAvProduct();
  const timeStep = useTimeStep();
  const actions = useAviationActions();

  const { data: gfaData } = useQuery(api.charts.gfa.queryOptions(undefined, { placeholderData: GFA_PLACEHOLDER_DATA }));
  const { data: lgfData } = useQuery(api.charts.lgf.queryOptions());
  const { data: hltData } = useQuery(api.charts.hlt.queryOptions());
  const { data: sigwxData } = useQuery(api.charts.sigwx.queryOptions());

  const handleChangeProduct = (p: ReturnType<typeof useAvProduct>) => {
    const newProduct = AVIATION_PRODUCTS[p][0];

    // if we don't have a domain for the new product, we can't switch to it
    // this should be an error
    if (!newProduct) {
      console.error("No new product available for the selected product:", p);
      return;
    }

    const hasCurrentTimeStep = newProduct.timeSteps > timeStep;

    actions.setProduct(p);
    actions.setDomain(newProduct.domain);
    actions.setTimeStep(hasCurrentTimeStep ? timeStep : newProduct.timeSteps - 1);
  };

  return (
    <>
      <div className="bg-neutral-800 text-white min-h-(--max-avn-height) max-md:min-h-(--md-avn-height)">
        <nav className="md:p-2 max-md:pt-2 max-md:grid max-md:grid-cols-4">
          <label className="me-2 max-md:hidden">Product:</label>
          {PRODUCTS.map((c, i) => (
            <Button
              className={`${
                product === c ? "active" : ""
              } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md`}
              key={i}
              onClick={() => handleChangeProduct(c)}
            >
              {c.toUpperCase()}
            </Button>
          ))}
        </nav>

        {product === "gfa" && <AvChartsGFA product={product} data={gfaData} />}
        {product === "lgf" && <AvChartsOther product={product} data={lgfData} />}
        {product === "hlt" && <AvChartsOther product={product} data={hltData} />}
        {product === "sigwx" && <AvChartsOther product={product} data={sigwxData} />}
      </div>
    </>
  );
}
