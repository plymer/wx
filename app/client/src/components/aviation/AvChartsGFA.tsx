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
  if (!data) return;

  // get our available domains for our currently selected product
  // we will use this to build the ui to switch between the different domains
  const domainList = AVIATION_PRODUCTS[product];

  // select the domain's product details so the user can select the forecast time they want to view
  const currentProduct = domainList.find((p) => p.domain === domain);

  // if our currentProduct is undefined, our current domain is not in the domainList
  // default it back to the first domain in the domainList
  if (!currentProduct && domainList[0]) actions.setDomain(domainList[0].domain);

  const currentProductData = data.find((d) => d.domain === domain);

  // build the image url
  const imageUrl = currentProductData && currentProductData[subProduct][timeStep];

  return (
    <>
      <nav className="md:px-2 max-md:pt-2 max-md:flex max-md:flex-wrap max-md:justify-center">
        <label className="me-4 max-md:hidden">Domain:</label>
        {domainList.map((r, i) => (
          <Button
            className={`rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md ${
              domain === r.domain ? "active" : ""
            }`}
            key={i}
            onClick={() => actions.setDomain(("gfacn3" + (i + 1).toString()) as ProductDomains)}
          >
            {r.domain.replace("gfacn", "gfa ").toUpperCase()}
          </Button>
        ))}
      </nav>
      <nav className="px-2 mt-2 flex max-md:justify-around place-items-center">
        <label className="me-4">Clouds & Weather:</label>
        <div>
          {currentProduct &&
            data.map(
              (p) =>
                p.domain === domain &&
                p.cldwx.map((u, i) => (
                  <Button
                    className={`rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md ${
                      subProduct === "cldwx" && timeStep === i ? "active" : ""
                    }`}
                    key={i}
                    value={u}
                    onClick={() => {
                      actions.setSubProduct!("cldwx");
                      actions.setTimeStep(i);
                    }}
                  >
                    T+{i * currentProduct.timeDelta}
                  </Button>
                )),
            )}
        </div>
      </nav>
      <nav className="px-2 mt-2 flex max-md:justify-around place-items-center">
        <label className="me-4">Turbulence & Icing:</label>
        <div>
          {currentProduct &&
            data.map(
              (p) =>
                p.domain === domain &&
                p.turbc.map((u, i) => (
                  <Button
                    className={`rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md ${
                      subProduct === "turbc" && timeStep === i ? "active" : ""
                    }`}
                    key={i}
                    value={u}
                    onClick={() => {
                      actions.setSubProduct!("turbc");
                      actions.setTimeStep(i);
                    }}
                  >
                    T+{i * currentProduct.timeDelta}
                  </Button>
                )),
            )}
        </div>
      </nav>
      {currentProduct && data && imageUrl && <AvImageContainer url={imageUrl} />}
    </>
  );
};

export default AvChartsGFA;
