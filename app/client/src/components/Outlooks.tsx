import { api } from "@/lib/trpc";
import { useOutlookActions, useOutlookProduct } from "@/stateStores/outlook";
import { useQuery } from "@tanstack/react-query";
import Button from "./ui/Button";

import OutlookContainer from "./outlook/OutlookContainer";
import { CloudLightning, Wind } from "lucide-react";

export default function Outlooks() {
  const product = useOutlookProduct();
  const actions = useOutlookActions();

  const { data: swoData } = useQuery(api.charts.swo.queryOptions());
  const { data: tsoData } = useQuery(api.charts.tso.queryOptions());

  // api returns undefined when we're still waiting on the response from the API
  if (tsoData === undefined || swoData === undefined) return;

  const currentData = product === "swo" ? swoData : tsoData;

  return (
    <div className="bg-neutral-800 text-white min-h-(--max-avn-height) max-md:min-h-(--md-avn-height)">
      <nav className="flex justify-center items-center md:p-2 max-md:pt-2">
        <label className="me-4 max-md:hidden">Product:</label>
        <Button
          disabled={swoData === null}
          className={`${
            product === "swo" ? "active" : ""
          } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md grow`}
          onClick={() => actions.setProduct("swo")}
        >
          <Wind className="shrink-0" />
          <div className="lg:hidden">SWO</div>
          <div className="max-lg:hidden">Significant Weather Outlook</div>
        </Button>
        <Button
          disabled={tsoData === null}
          className={`${
            product === "tso" ? "active" : ""
          } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md grow`}
          onClick={() => actions.setProduct("tso")}
        >
          <CloudLightning className="shrink-0" />
          <div className="lg:hidden">TSO</div>
          <div className="max-lg:hidden">Thunderstorm Outlook</div>
        </Button>
      </nav>

      <OutlookContainer data={currentData} />
    </div>
  );
}
