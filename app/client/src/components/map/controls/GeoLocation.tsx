import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useMap } from "react-map-gl/maplibre";
import { Loader2, Navigation } from "lucide-react";
import LocationMarker from "@/components/ui/LocationMarker";

export const GeoLocation = () => {
  const map = useMap().current;
  const [loading, setLoading] = useState(false);
  const [currentPos, setCurrentPos] = useState<GeolocationPosition | null>(null);
  const [tracking, setTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const hasCenteredRef = useRef(false);

  // start watching the user's location continuously
  const startTracking = () => {
    if (!("geolocation" in navigator)) return;
    if (watchIdRef.current !== null) return; // already watching
    setLoading(true);
    hasCenteredRef.current = false;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLoading(false);
        setTracking(true);
        setCurrentPos(pos);
        // center once on first fix to avoid constant recentering
        if (!hasCenteredRef.current && map) {
          hasCenteredRef.current = true;
          map.easeTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: map.getZoom() });
        }
      },
      (err) => {
        setLoading(false);
        setTracking(false);
        setCurrentPos(null);
        console.error("Geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  };

  // stop watching the user's location
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  };

  // toggle tracking on button click
  const geolocateTrigger = () => {
    if (tracking) stopTracking();
    else startTracking();
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return (
    <>
      <Button
        size="icon"
        variant="floating"
        onClick={geolocateTrigger}
        aria-label={tracking ? "Stop location tracking" : "Start location tracking"}
        title={tracking ? "Stop location tracking" : "Start location tracking"}
        disabled={loading}
        // className={`${tracking ? "bg-secondary border-secondary-foreground" : ""}`}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Navigation
            className={`${tracking ? "animate-[pulse_2s_ease-in-out_infinite] fill-primary-foreground" : ""}`}
          />
        )}
      </Button>
      {tracking && currentPos && <LocationMarker position={currentPos} />}
    </>
  );
};
