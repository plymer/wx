import {
  HEAVY_AIRCRAFT_TYPES,
  LIGHT_AIRCRAFT_TYPES,
  MEDIUM_AIRCRAFT_TYPES,
  SUPER_AIRCRAFT_TYPES,
} from "../config/pireps.js";
import { Nullable, PirepSeverity, WakeTurbClass } from "../types.js";

export const calculateSeverity = (
  turbulence: Uppercase<PirepSeverity> | null,
  icing: Uppercase<PirepSeverity> | null,
  ws: boolean,
): PirepSeverity => {
  if (ws) {
    return "sev";
  }
  if (turbulence === "LGT" || icing === "LGT") {
    return "lgt";
  }
  if (turbulence === "MOD" || icing === "MOD") {
    return "mod";
  }
  if (turbulence === "SEV" || icing === "SEV") {
    return "sev";
  }
  return "none";
};

export function getWakeTurbulenceClass(aircraftType: string | null | undefined): WakeTurbClass | "UNKN" {
  if (!aircraftType) return "UNKN";

  const type = aircraftType.toLowerCase().trim();

  if (SUPER_AIRCRAFT_TYPES.includes(type)) return "J";
  if (HEAVY_AIRCRAFT_TYPES.includes(type)) return "H";
  if (MEDIUM_AIRCRAFT_TYPES.includes(type)) return "M";
  if (LIGHT_AIRCRAFT_TYPES.includes(type)) return "L";
  return "UNKN";
}
