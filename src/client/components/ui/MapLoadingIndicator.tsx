import { Loader2 } from "lucide-react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {}

const MapLoadingIndicator = ({ ...props }: Props) => {
  return (
    <div
      className={`absolute animate-[loadingSlide_0.5s_ease_0s_1_normal_forwards] top-0 left-0 rounded-xl inline-flex place-items-center my-2 mx-3 py-0.5 px-2 text-white bg-accent border-1 border-primary drop-shadow-lg ${props.className}`}
    >
      <Loader2 className="animate-spin inline me-2 size-4" /> Loading...
    </div>
  );
};

export default MapLoadingIndicator;
