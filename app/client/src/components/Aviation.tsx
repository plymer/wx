import type { Products } from "@/lib/types";
import { useAviationActions, useDomain, useHub, useAvProduct } from "@/stateStores/aviation";
import AvChartsGFA from "./aviation/AvChartsGFA";
import AvChartsOther from "./aviation/AvChartsOther";
import HubDiscussion from "./aviation/HubDiscussion";
import Button from "./ui/Button";
import { AVIATION_PRODUCTS, PRODUCTS } from "@/config/aviationProducts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/trpc";
import { Activity, useEffect, useRef } from "react";

export default function Aviation() {
  const product = useAvProduct();
  const domain = useDomain();
  const hub = useHub();
  const actions = useAviationActions();
  const lastDomainByProduct = useRef<Partial<Record<Products, string>>>({});

  const { data: gfaData } = useQuery(api.charts.gfa.queryOptions());
  const { data: lgfData } = useQuery(api.charts.lgf.queryOptions());
  const { data: hltData } = useQuery(api.charts.hlt.queryOptions());
  const { data: sigwxData } = useQuery(api.charts.sigwx.queryOptions());

  useEffect(() => {
    if (AVIATION_PRODUCTS[product].some((p) => p.domain === domain)) {
      lastDomainByProduct.current[product] = domain;
    }
  }, [domain, product]);

  const handleProductChange = (nextProduct: Products) => {
    actions.setProduct(nextProduct);

    const savedDomain = lastDomainByProduct.current[nextProduct];
    const nextDomain = AVIATION_PRODUCTS[nextProduct].find((p) => p.domain === savedDomain)?.domain;
    const fallbackDomain = AVIATION_PRODUCTS[nextProduct][0]?.domain;

    if (nextDomain) actions.setDomain(nextDomain);
    else if (fallbackDomain) actions.setDomain(fallbackDomain);
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
              onClick={() => handleProductChange(c as Products)}
            >
              {c.toUpperCase()}
            </Button>
          ))}
        </nav>

        {/* gfa section */}
        <Activity mode={product === "gfa" ? "visible" : "hidden"}>
          <AvChartsGFA product={product} data={gfaData} />
        </Activity>

        {/* lgf section */}
        <Activity mode={product === "lgf" ? "visible" : "hidden"}>
          <AvChartsOther product={product} data={lgfData} />
        </Activity>

        {/* hlt section */}
        <Activity mode={product === "hlt" ? "visible" : "hidden"}>
          <AvChartsOther product={product} data={hltData} />
        </Activity>

        {/* sigwx section */}
        <Activity mode={product === "sigwx" ? "visible" : "hidden"}>
          <AvChartsOther product={product} data={sigwxData} />
        </Activity>

        {/* hub discussion section */}
        <Activity mode={product === "hubs" ? "visible" : "hidden"}>
          <HubDiscussion hub={hub} />
        </Activity>
      </div>
    </>
  );
}
