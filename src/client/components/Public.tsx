import { useBulletin, useOffice, usePublicActions } from "../stateStores/public";

import { PUBLIC_FORECAST_CONFIG } from "../config/public";
import { PublicBulletin } from "../lib/types";
import useAPI from "../hooks/useAPI";
import Button from "./ui/button";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export default function Public() {
  const office = useOffice();
  const bulletin = useBulletin();
  const actions = usePublicActions();

  const [productList, setProductList] = useState({});
  const [issuerCode, setIssuerCode] = useState("");
  const [productCode, setProductCode] = useState("");

  // right now, this effect fires whenever we change the office OR the bulletin
  // but we actually need different logic for each of those cases
  // when we change bulletin, update the issuer code and product code because each office can cover multiple issuers

  // BUT

  // when we change the office, we should try to default the product selected back to the first product in the list, unless the current bulletin is still valid for the new office (i.e. in the case of the FOCN45CWWG product, which is available in multiple offices)

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

  return (
    <div className="p-2 bg-neutral-800 text-white text-sm">
      <div className="flex items-center ">
        <h3 className="inline-block">Office:</h3>
        <div className="ms-2 min-w-fit w-full inline-block">
          <Select
            defaultValue={office}
            onValueChange={(e) => actions.setOffice(e as keyof typeof PUBLIC_FORECAST_CONFIG)}
          >
            <SelectTrigger className=" text-black">
              <SelectValue placeholder={productList[(productCode + issuerCode) as keyof typeof productList]} />
            </SelectTrigger>
            <SelectContent className="inline-block">
              {Object.keys(PUBLIC_FORECAST_CONFIG).map((office, index) => (
                <SelectItem key={index} value={office}>
                  {PUBLIC_FORECAST_CONFIG[office as keyof typeof PUBLIC_FORECAST_CONFIG].shortName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center border-y-2 border-white my-2 py-2">
        <h3 className="inline-block">Products:</h3>
        <div className="ms-2 min-w-fit w-full inline-block">
          <Select defaultValue={productCode} onValueChange={(e) => actions.setBulletin(e as string)}>
            <SelectTrigger className=" text-black">
              <SelectValue placeholder={productList[(productCode + issuerCode) as keyof typeof productList]} />
            </SelectTrigger>
            <SelectContent className="inline-block">
              {Object.keys(productList).map((product, index) => (
                <SelectItem key={index} value={product}>
                  {productList[product as keyof typeof productList]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {productList[(productCode + issuerCode) as keyof typeof productList] && data && data.data ? (
        <pre
          className="overflow-y-scroll whitespace-pre-wrap md:px-6 max-md:pb-12"
          style={{ height: "calc(100svh - 10.75rem)" }}
        >
          {data.data.trim()}
        </pre>
      ) : (
        <pre>No Product available</pre>
      )}
    </div>
  );
}
