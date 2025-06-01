import { Marker } from "react-map-gl/maplibre";

interface Props {
  position: GeolocationPosition;
}

const LocationMarker = ({ position }: Props) => {
  const centerMe = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

  return (
    <Marker longitude={position.coords.longitude} latitude={position.coords.latitude}>
      <div
        key="position-dot-pulse"
        className={`size-8 rounded-full animate-ping inset-0 bg-radial from bg-blue-500/50 to-bg-transparent ${centerMe}`}
      />
      <div key="position-dot-heading-cone" className={`${centerMe}`} />
      <div
        key="position-dot"
        className={`bg-blue-500 border-white border-2 text-black rounded-full p-2 size-5 ${centerMe}`}
      />
    </Marker>
  );
};

export default LocationMarker;
