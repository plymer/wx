import { useState, useImperativeHandle, forwardRef } from "react";
import Button from "../ui/Button";
import { useMap } from "react-map-gl/maplibre";
import { Crosshair, Loader2 } from "lucide-react";
import LocationMarker from "../ui/LocationMarker";

export interface GeoLocationProps {
  onSuccess?: (pos: GeolocationPosition) => void;
  onError?: (err: GeolocationPositionError) => void;
  label?: string;
}

export interface GeoLocationHandle {
  trigger: () => void;
}

export const GeoLocation = forwardRef<GeoLocationHandle, GeoLocationProps>(({ onSuccess, onError, label }, ref) => {
  const map = useMap().current;
  const [loading, setLoading] = useState(false);
  const [currentPos, setCurrentPos] = useState<GeolocationPosition | null>(null);

  // this triggers the actual geolocation request
  const trigger = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onSuccess?.(pos);
        setCurrentPos(pos);
        if (map) map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: map.getZoom() });
      },
      (err) => {
        setLoading(false);
        onError?.(err);
        setCurrentPos(null);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useImperativeHandle(ref, () => ({ trigger }));

  return (
    <>
      <Button size="icon" variant={"floating"} onClick={trigger} aria-label={label} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <Crosshair />}
      </Button>
      {currentPos && <LocationMarker position={currentPos} />}
    </>
  );
});
