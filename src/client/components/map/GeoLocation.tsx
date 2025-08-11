import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import { useMap } from "react-map-gl/maplibre";
import { Crosshair, Loader2, Locate, Navigation, NavigationOff } from "lucide-react";
import LocationMarker from "../ui/LocationMarker";

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
          map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: map.getZoom() });
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
        variant={"floating"}
        onClick={geolocateTrigger}
        aria-label={tracking ? "Stop location tracking" : "Start location tracking"}
        title={tracking ? "Stop location tracking" : "Start location tracking"}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : tracking ? (
          <Navigation className="animate-pulse" />
        ) : (
          <NavigationOff />
        )}
      </Button>
      {tracking && currentPos && <LocationMarker position={currentPos} />}
    </>
  );
};
