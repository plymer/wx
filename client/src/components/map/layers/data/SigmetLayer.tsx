import XmetLayer from "../base/XmetLayer";
import useAPI from "@/hooks/useAPI";
import { XmetGeoJSON } from "@/lib/types";
import { useShowSIGMETs } from "@/stateStores/map/vectorData";

/**
 * Opinionated SIGMET layer that automatically fetches and displays SIGMET data
 * using the state-controlled visibility setting from the vector data store.
 */
export function SigmetLayer() {
  // Get SIGMET visibility from state store
  const showSIGMETs = useShowSIGMETs();

  // Get required state for vector layer constraints

  const {
    data: sigmetData,
    isLoading,
    error,
  } = useAPI<XmetGeoJSON>("/alpha/sigmets", { hours: 6 }, { queryName: "sigmet", enabled: showSIGMETs, interval: 1 });

  // Don't render if SIGMETs are disabled in state
  if (!showSIGMETs) return null;

  if (isLoading) return null;

  if (error) {
    console.error("[SigmetLayer] Failed to load SIGMET data:", error);
    return null;
  }

  if (!sigmetData || sigmetData.status !== "success") {
    return null;
  }

  return <XmetLayer dataType="sigmet" jsonData={sigmetData} belowLayer={"place_state"} />;
}
