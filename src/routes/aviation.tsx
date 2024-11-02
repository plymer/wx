import AvChartsGFA from "@/components/AvChartsGFA";
import AvChartsOther from "@/components/AvChartsOther";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/aviation")({
  component: AviationComponent,
});

function AviationComponent() {
  const [category, setCategory] = useState("gfa");

  const CATEGORIES = ["gfa", "lgf", "hlt", "sigwx"];

  return (
    <>
      <div className="bg-neutral-800 text-white ">
        <nav className="p-2">
          <label className="me-4">Product:</label>
          {CATEGORIES.map((c, i) => (
            <Button
              className="rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
              variant={"secondary"}
              key={i}
              onClick={() => setCategory(c)}
            >
              {c.toUpperCase()}
            </Button>
          ))}
        </nav>
        {category === "gfa" ? <AvChartsGFA /> : ""}
        {category !== "gfa" ? <AvChartsOther category={category} /> : ""}
      </div>
    </>
  );
}
