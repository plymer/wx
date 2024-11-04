import AvChartsGFA from "@/components/AvChartsGFA";
import AvChartsOther from "@/components/AvChartsOther";
import HubDiscussion from "@/components/HubDiscussion";
import { Button } from "@/components/ui/button";
import { useAviationContext } from "@/contexts/aviationContext";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/aviation")({
  component: AviationComponent,
});

export const PRODUCTS = ["gfa", "lgf", "hlt", "sigwx", "hubs"];

function AviationComponent() {
  const aviation = useAviationContext();

  return (
    <>
      <div className="bg-neutral-800 text-white ">
        <nav className="md:p-2 max-md:pt-2">
          <label className="me-2 max-md:hidden">Product:</label>
          {PRODUCTS.map((c, i) => (
            <Button
              className="rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/5"
              variant={aviation.product === c ? "selected" : "secondary"}
              key={i}
              onClick={() => aviation.setProduct(c)}
            >
              {c.toUpperCase()}
            </Button>
          ))}
        </nav>
        {aviation.product === "gfa" ? <AvChartsGFA /> : ""}
        {aviation.product !== "gfa" && aviation.product !== "hubs" ? <AvChartsOther /> : ""}
        {aviation.product === "hubs" ? <HubDiscussion /> : ""}
      </div>
    </>
  );
}
