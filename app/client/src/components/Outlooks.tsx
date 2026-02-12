import { api } from "@/lib/trpc";
import { useOutlookActions, useOutlookOffice, useOutlookProduct, useOutlookRegion } from "@/stateStores/outlook";
import { useQuery } from "@tanstack/react-query";
import Button from "./ui/Button";

export default function Outlooks() {
  const product = useOutlookProduct();
  const office = useOutlookOffice();
  const actions = useOutlookActions();

  const { data: swoData } = useQuery(api.charts.swo.queryOptions());
  const { data: tsoData } = useQuery(api.charts.tso.queryOptions());

  console.log(tsoData);

  return (
    <>
      <div className="bg-neutral-800 text-white min-h-(--max-avn-height) max-md:min-h-(--md-avn-height)">
        <nav className="md:p-2 max-md:pt-2">
          {swoData != undefined && tsoData != undefined && (
            <>
              <label className="me-2 max-md:hidden">Product:</label>
              <Button
                className={`${
                  product === "swo" ? "active" : ""
                } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/5`}
                onClick={() => actions.setProduct("swo")}
              >
                SWO
              </Button>
              <Button
                className={`${
                  product === "tso" ? "active" : ""
                } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/5`}
                onClick={() => actions.setProduct("tso")}
              >
                TSO
              </Button>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
