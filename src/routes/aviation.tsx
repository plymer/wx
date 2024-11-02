import AvChartsGFA from "@/components/AvChartsGFA";
import AvChartsOther from "@/components/AvChartsOther";
import HubDiscussion from "@/components/HubDiscussion";
import { Button } from "@/components/ui/button";

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/aviation")({
  component: AviationComponent,
});

function AviationComponent() {
  const [category, setCategory] = useState("gfa");

  const CATEGORIES = ["gfa", "lgf", "hlt", "sigwx", "hubs"];

  return (
    <>
      <div className="bg-neutral-800 text-white ">
        <nav className="md:p-2 max-md:pt-2">
          <label className="me-2 max-md:hidden">Product:</label>
          {CATEGORIES.map((c, i) => (
            <Button
              className="rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/5"
              variant={category === c ? "selected" : "secondary"}
              key={i}
              onClick={() => setCategory(c)}
            >
              {c.toUpperCase()}
            </Button>
          ))}
        </nav>
        {category === "gfa" ? <AvChartsGFA /> : ""}
        {category !== "gfa" && category !== "hubs" ? <AvChartsOther category={category} /> : ""}
        {category === "hubs" ? <HubDiscussion /> : ""}
      </div>
    </>
  );
}
