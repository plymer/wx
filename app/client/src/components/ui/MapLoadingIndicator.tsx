import { Loader2 } from "lucide-react";
import SlideComponent from "./SlideComponent";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  show: boolean;
}

const MapLoadingIndicator = ({ show, ...props }: Props) => {
  return (
    <SlideComponent
      isVisible={show}
      className={`absolute top-0 left-0 rounded-xl inline-flex place-items-center my-2 mx-3 py-0.5 px-2 text-white bg-accent border-1 border-primary drop-shadow-lg ${props.className}`}
    >
      <Loader2 className="animate-spin inline me-2 size-4" /> Loading...
    </SlideComponent>
  );
};

export default MapLoadingIndicator;
