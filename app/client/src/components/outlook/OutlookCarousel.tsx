import type { Region } from "@/lib/types";
import { Carousel, CarouselContent } from "../ui/Carousel";
import { useOutlookRegion, useOutlookValid } from "@/stateStores/outlook";

interface OutlookCarouselProps {
  officeData: Record<string, Region>;
}

const OutlookCarousel = ({ officeData }: OutlookCarouselProps) => {
  const valid = useOutlookValid();
  const region = useOutlookRegion();

  return (
    <Carousel>
      <CarouselContent></CarouselContent>
    </Carousel>
  );
};
export default OutlookCarousel;
