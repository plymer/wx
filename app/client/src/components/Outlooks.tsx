import { api } from "@/lib/trpc";
import { useOutlookActions, useOutlookProduct } from "@/stateStores/outlook";
import { useQuery } from "@tanstack/react-query";
import Button from "./ui/Button";

import OutlookContainer from "./outlook/OutlookContainer";

export default function Outlooks() {
  const product = useOutlookProduct();
  const actions = useOutlookActions();

  const { data: swoData } = useQuery(api.charts.swo.queryOptions());
  const { data: tsoData } = useQuery(api.charts.tso.queryOptions());
  const currentData = product === "swo" ? swoData : tsoData;

  return (
    <div className="bg-neutral-800 text-white min-h-(--max-avn-height) max-md:min-h-(--md-avn-height)">
      <nav className="md:p-2 max-md:pt-2">
        <label className="me-2 max-md:hidden">Product:</label>
        <Button
          disabled={swoData === undefined}
          className={`${
            product === "swo" ? "active" : ""
          } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/5`}
          onClick={() => actions.setProduct("swo")}
        >
          SWO
        </Button>
        <Button
          disabled={tsoData === undefined}
          className={`${
            product === "tso" ? "active" : ""
          } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/5`}
          onClick={() => actions.setProduct("tso")}
        >
          TSO
        </Button>
      </nav>

      <OutlookContainer data={currentData} />
    </div>
  );
}
