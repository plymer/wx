"use client";

import type { Panel, Region } from "@/lib/types";
import OutlookCard from "./OutlookCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "../ui/Carousel";
import { useOutlookActions, useOutlookRegion, useOutlookValidPeriod } from "@/stateStores/outlook";
import { useEffect, useState } from "react";

interface OutlookCarouselProps {
  officeData: Region;
}

const validIndex = (valid: string, panels: Panel[]): number => {
  return panels.findIndex((panel) => panel.validPeriod === valid);
};

const OutlookCarousel = ({ officeData }: OutlookCarouselProps) => {
  const valid = useOutlookValidPeriod();
  const region = useOutlookRegion();
  const { setRegion } = useOutlookActions();

  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    const handleCloseCarousel = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setRegion(null);
      }
    };

    window.addEventListener("keydown", handleCloseCarousel);

    return () => {
      window.removeEventListener("keydown", handleCloseCarousel);
    };
  }, [setRegion]);

  useEffect(() => {
    if (api && valid) {
      const index = validIndex(valid, officeData.panels);
      if (index !== -1) {
        api.scrollTo(index);
      }
    }
  }, [valid, region, officeData, api]);

  return (
    <div className="flex items-center justify-center">
      <Carousel setApi={setApi} opts={{ align: "center" }} className="w-full max-w-6xl mx-auto">
        <CarouselContent>
          {officeData.panels.map((panel) => (
            <CarouselItem key={panel.id} onClick={() => setRegion(null)}>
              {<OutlookCard panel={panel} />}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 absolute" />
        <CarouselNext className="right-4 absolute" />
      </Carousel>
    </div>
  );
};
export default OutlookCarousel;
