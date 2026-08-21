import { api } from "@/lib/trpc";
import { useShowObs } from "@/stateStores/map/vectorData";
import { useQuery } from "@tanstack/react-query";

export const useStationDataForPopup = () => {
  const enabled = useShowObs();
  const query = useQuery(
    api.wxmap.wxmapPopupData.queryOptions(undefined, {
      enabled,
      trpc: { context: { skipBatch: true } },
    }),
  );

  return query;
};
