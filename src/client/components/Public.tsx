import { useBulletin, useOffice, usePublicActions } from "../stateStores/public";

import { PUBLIC_FORECAST_CONFIG } from "../config/public";
import { PublicBulletin } from "../lib/types";
import useAPI from "../hooks/useAPI";
import Button from "./ui/button";
import { useEffect, useState } from "react";

export default function Public() {
  const office = useOffice();
  const bulletin = useBulletin();
  const actions = usePublicActions();

  const [productList, setProductList] = useState({});
  const [issuerCode, setIssuerCode] = useState("");
  const [productCode, setProductCode] = useState("");

  useEffect(() => {
    const products = PUBLIC_FORECAST_CONFIG[office].products;
    const issuer = bulletin.slice(-4);
    const product = bulletin.slice(0, 6);

    setProductList(products);
    setIssuerCode(issuer);
    setProductCode(product);

    return () => {
      setProductList({});
      setIssuerCode("");
      setProductCode("");
    };
  }, [office, bulletin]);

  const { data, fetchStatus } = useAPI<PublicBulletin>("/alpha/public/bulletin", {
    office: issuerCode,
    bulletin: productCode,
  });

  console.log(issuerCode, productCode);

  return (
    <div className="p-2 bg-neutral-800 text-white">
      <div>
        <h3 className="border-b-2 border-white mb-2">Office List:</h3>
        {Object.keys(PUBLIC_FORECAST_CONFIG).map((key) => (
          <Button
            onClick={() => actions.setOffice(key as keyof typeof PUBLIC_FORECAST_CONFIG)}
            variant={`${office === key ? "selected" : "secondary"}`}
          >
            {PUBLIC_FORECAST_CONFIG[key as keyof typeof PUBLIC_FORECAST_CONFIG].shortName}
          </Button>
        ))}
      </div>
      <div>
        <h3 className="border-b-2 border-white mb-2">Product List:</h3>
        {productList &&
          Object.keys(productList).map((product) => (
            <Button
              key={product}
              onClick={() => actions.setBulletin(product)}
              variant={`${product === `${productCode}${issuerCode}` ? "selected" : "secondary"}`}
            >
              {productList[product as keyof typeof productList]}
            </Button>
          ))}
      </div>
      <h3 className="border-b-2 border-white mb-2">Product Text:</h3>
      {Object.keys(productList).length !== 0 && data && data.data ? (
        <pre className="overflow-y-scroll" style={{ height: "calc(100svh - 15.3rem)" }}>
          {data.data.trim()}
        </pre>
      ) : (
        <pre>No Product available</pre>
      )}
    </div>
  );
}
