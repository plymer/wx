import { useAviationActions, useHub, useAvProduct, useTimeStep } from "@/stateStores/aviation";
import AvChartsGFA from "./aviation/AvChartsGFA";
import AvChartsOther from "./aviation/AvChartsOther";
import HubDiscussion from "./aviation/HubDiscussion";
import Button from "./ui/Button";
import { AVIATION_PRODUCTS, GFA_PLACEHOLDER_DATA, PRODUCTS } from "@/config/aviationProducts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";

export default function Aviation() {
  const product = useAvProduct();
  const hub = useHub();
  const timeStep = useTimeStep();
  const actions = useAviationActions();

  const { data: gfaData } = useQuery(api.charts.gfa.queryOptions(undefined, { placeholderData: GFA_PLACEHOLDER_DATA }));
  const { data: lgfData } = useQuery(api.charts.lgf.queryOptions());
  const { data: hltData } = useQuery(api.charts.hlt.queryOptions());
  const { data: sigwxData } = useQuery(api.charts.sigwx.queryOptions());

  const handleChangeProduct = (p: ReturnType<typeof useAvProduct>) => {
    // if we're switching to hubs, we don't need to update all of the other state so just bail early
    if (p === "hubs") {
      actions.setProduct(p);
      return;
    }

    const newProduct = AVIATION_PRODUCTS[p][0];

    // if we don't have a domain for the new product, we can't switch to it
    if (!newProduct) return;

    const hasCurrentTimeStep = newProduct.timeSteps > timeStep;

    actions.setProduct(p);
    actions.setDomain(newProduct.domain);
    actions.setTimeStep(hasCurrentTimeStep ? timeStep : newProduct.timeSteps - 1);
  };

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

        {product === "hubs" && <HubDiscussion hub={hub} />}
      </div>
    </>
  );
}
