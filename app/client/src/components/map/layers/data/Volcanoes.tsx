import { useShowVolcanoes } from "@/stateStores/map/vectorData";
import { VolcanicAshAreas } from "./volcanoes/VolcanicAshAreas";
import { VolcanoCodes } from "./volcanoes/VolcanoCodes";

export const Volcanoes = () => {
  const enabled = useShowVolcanoes();

  if (!enabled) return null;

  return (
    <>
      <VolcanoCodes />
      <VolcanicAshAreas />
    </>
  );
};
