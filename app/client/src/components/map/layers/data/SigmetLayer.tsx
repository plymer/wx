import { api } from "@/lib/trpc";
import XmetLayer from "../base/XmetLayer";
import { useShowSIGMETs } from "@/stateStores/map/vectorData";
import { useQuery } from "@tanstack/react-query";
import { MINUTE } from "@shared/lib/constants";

/**
 * Opinionated SIGMET layer that automatically fetches and displays SIGMET data
 * using the state-controlled visibility setting from the vector data store.
 */
export function SigmetLayer() {
  // Get SIGMET visibility from state store
  const enabled = useShowSIGMETs();
  const {
    data: sigmetData,
    isLoading,
    error,
  } = useQuery(
    api.alpha.sigmets.queryOptions(
      { hours: 6 },
      { enabled, refetchInterval: MINUTE, trpc: { context: { skipBatch: true } } },
    ),
  );

  // Don't render if SIGMETs are disabled in state
  if (!enabled) return null;

  if (isLoading) return null;

  if (error) {
    console.error("[SigmetLayer] Failed to load SIGMET data:", error);
    return null;
  }

  if (!sigmetData) {
    return null;
  }

  return <XmetLayer dataType="sigmet" jsonData={sigmetData} belowLayer={"place_state"} />;
}
