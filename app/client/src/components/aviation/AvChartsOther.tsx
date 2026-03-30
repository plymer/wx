import { AVIATION_PRODUCTS } from "@/config/aviationProducts";
import type { OtherChartData, Products } from "@/lib/types";
import { useAviationActions, useDomain, useTimeStep } from "@/stateStores/aviation";
import Button from "../ui/Button";

import AvImageContainer from "./AvImageContainer";

interface Props {
  product: Products;
  data?: OtherChartData[];
}

const AvChartsOther = ({ product, data }: Props) => {
  // get our state variables and mutation
  const domain = useDomain();
  const timeStep = useTimeStep();
  const actions = useAviationActions();

  if (!data) return;

  // get our available domains for our currently selected product
  // we will use this to build the ui to switch between the different domains
  const domainList = AVIATION_PRODUCTS[product];

  // select the domain's product details so the user can select the forecast time they want to view
  const currentProduct = domainList.find((p) => p.domain === domain);

  const currentProductData = data.find((d) => d.domain === domain);

  const handleChangeDomain = (d: ReturnType<typeof useDomain>) => {
    actions.setDomain(d);
    actions.setTimeStep(0);
  };

  // if our current timeStep is greater than the number of timeSteps available in our data layer
  // default it back to the highest available timeStep
  if (currentProductData && timeStep > currentProductData.images.length - 1)
    actions.setTimeStep(currentProductData.images.length - 1);

  // build the image url
  const imageUrl = currentProductData?.images[timeStep];

  return (
    <>
      <nav className="md:px-2 max-md:pt-2 max-md:flex max-md:flex-wrap max-md:justify-center">
        <label className="me-4 max-md:hidden">Domain:</label>
        {domainList.map((d, i) => (
          <Button
            className={`rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-w-96 ${
              d.domain === domain ? "active" : ""
            }`}
            key={i}
            onClick={() => handleChangeDomain(d.domain)}
          >
            <span className="md:hidden">{d.shortName}</span>
            <span className="max-md:hidden">{d.longName}</span>
          </Button>
        ))}
      </nav>
      <nav className="px-2 mt-2 flex max-md:justify-around place-items-center">
        <label className="me-4">Forecasts:</label>
        <div>
          {currentProduct &&
            data.map(
              (p) =>
                p.domain === currentProduct.domain &&
                p.images.map((u, i) => (
                  <Button
                    className={`rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md ${
                      timeStep === i ? "active" : ""
                    }`}
                    key={i}
                    value={u}
                    onClick={() => {
                      actions.setTimeStep(i);
                    }}
                  >
                    T+
                    {i * currentProduct.timeDelta}
                  </Button>
                )),
            )}
        </div>
      </nav>
      {currentProduct && data && imageUrl && <AvImageContainer url={imageUrl} />}
    </>
  );
};

export default AvChartsOther;
