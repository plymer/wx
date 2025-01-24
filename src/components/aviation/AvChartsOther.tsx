import { OtherChartData } from "@/lib/types";

import { Button } from "../ui/button";

import { AVIATION_PRODUCTS, Products } from "@/config/aviationProducts";
import { useAviation } from "@/stateStores/aviation";
import AvImageContainer from "./AvImageContainer";

interface Props {
  product: Products;
  data?: OtherChartData[];
  fetchStatus: string;
}

const AvChartsOther = ({ product, data, fetchStatus }: Props) => {
  // get our state variables and mutation
  const domain = useAviation((state) => state.domain);
  const setDomain = useAviation((state) => state.setDomain);

  const timeStep = useAviation((state) => state.timeStep);
  const setTimeStep = useAviation((state) => state.setTimeStep);

  // get our available domains for our currently selected product
  // we will use this to build the ui to switch between the different domains
  const domainList = AVIATION_PRODUCTS[product];

  // select the domain's product details so the user can select the forecast time they want to view
  const currentProduct = domainList.find((p) => p.domain === domain);

  // if our currentProduct is undefined, our current domain is not in the domainList
  // default it back to the first domain in the domainList
  !currentProduct && setDomain(domainList[0].domain);

  const currentProductData = data?.find((d) => d.domain === domain);

  // if our current timeStep is greater than the number of timeSteps available in our data layer
  // default it back to the highest available timeStep
  currentProductData &&
    timeStep > currentProductData.images.length - 1 &&
    setTimeStep(currentProductData.images.length - 1);

  // build the image url
  const imageUrl = currentProductData?.images[timeStep];

  return (
    <>
      <nav className="md:px-2 max-md:pt-2 max-md:flex max-md:flex-wrap max-md:justify-center">
        <label className="me-4 max-md:hidden">Domain:</label>
        {domainList.map((d, i) => (
          <Button
            variant={d.domain === domain ? "selected" : "secondary"}
            className="rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-w-44"
            key={i}
            onClick={() => {
              setDomain(d.domain);
            }}
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
            data?.map(
              (p) =>
                p.domain === currentProduct.domain &&
                p.images.map((u, i) => (
                  <Button
                    className="rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
                    variant={timeStep === i ? "selected" : "secondary"}
                    key={i}
                    value={u}
                    onClick={() => {
                      setTimeStep(i);
                    }}
                  >
                    T+
                    {i * currentProduct.timeDelta}
                  </Button>
                ))
            )}
        </div>
      </nav>
      {currentProduct && data && imageUrl && <AvImageContainer url={imageUrl} />}
    </>
  );
};

export default AvChartsOther;
