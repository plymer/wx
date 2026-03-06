import { AVIATION_PRODUCTS } from "@/config/aviationProducts";
import type { GFAData, ProductDomains, Products } from "@/lib/types";
import { useAviationActions, useDomain, useAvSubProduct, useTimeStep } from "@/stateStores/aviation";
import Button from "../ui/Button";

import AvImageContainer from "./AvImageContainer";

interface Props {
  product: Products;
  data?: GFAData[];
}

const AvChartsGFA = ({ product, data }: Props) => {
  // get our state variables and mutation
  const domain = useDomain();
  const subProduct = useAvSubProduct();
  const timeStep = useTimeStep();
  const actions = useAviationActions();

  // if we don't have any data, or the data is not successful, return early
  if (!data) return null;

  // get our available domains for our currently selected product
  // we will use this to build the ui to switch between the different domains
  const domainList = AVIATION_PRODUCTS[product];

  // select the domain's product details so the user can select the forecast time they want to view
  const currentProduct = domainList.find((p) => p.domain === domain);

  const selectedDomain = currentProduct?.domain ?? domainList[0]?.domain;
  const selectedProduct = currentProduct ?? domainList[0];
  const currentProductData = selectedDomain ? data.find((d) => d.domain === selectedDomain) : undefined;
  const selectedSteps = currentProductData ? currentProductData[subProduct] : undefined;
  const safeTimeStep = selectedSteps ? Math.min(timeStep, Math.max(selectedSteps.length - 1, 0)) : timeStep;

  // build the image url
  const imageUrl = selectedSteps?.[safeTimeStep];

  return (
    <>
      <nav className="md:px-2 max-md:pt-2 max-md:flex max-md:flex-wrap max-md:justify-center">
        <label className="me-4 max-md:hidden">Domain:</label>
        {domainList.map((r, i) => (
          <Button
            className={`rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md ${
              selectedDomain === r.domain ? "active" : ""
            }`}
            key={i}
            onClick={() => actions.setDomain(r.domain as ProductDomains)}
          >
            {r.domain.replace("gfacn", "gfa ").toUpperCase()}
          </Button>
        ))}
      </nav>
      <nav className="px-2 mt-2 flex max-md:justify-around place-items-center">
        <label className="me-4">Clouds & Weather:</label>
        <div>
          {selectedProduct &&
            data.map(
              (p) =>
                p.domain === selectedDomain &&
                p.cldwx.map((u, i) => (
                  <Button
                    className={`rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md ${
                      subProduct === "cldwx" && safeTimeStep === i ? "active" : ""
                    }`}
                    key={i}
                    value={u}
                    onClick={() => {
                      actions.setSubProduct("cldwx");
                      actions.setTimeStep(i);
                    }}
                  >
                    T+{i * selectedProduct.timeDelta}
                  </Button>
                )),
            )}
        </div>
      </nav>
      <nav className="px-2 mt-2 flex max-md:justify-around place-items-center">
        <label className="me-4">Turbulence & Icing:</label>
        <div>
          {selectedProduct &&
            data.map(
              (p) =>
                p.domain === selectedDomain &&
                p.turbc.map((u, i) => (
                  <Button
                    className={`rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md ${
                      subProduct === "turbc" && safeTimeStep === i ? "active" : ""
                    }`}
                    key={i}
                    value={u}
                    onClick={() => {
                      actions.setSubProduct("turbc");
                      actions.setTimeStep(i);
                    }}
                  >
                    T+{i * selectedProduct.timeDelta}
                  </Button>
                )),
            )}
        </div>
      </nav>
      {selectedProduct && imageUrl && <AvImageContainer url={imageUrl} />}
    </>
  );
};

export default AvChartsGFA;
