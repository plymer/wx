import { Loader2 } from "lucide-react";

interface Props {
  displayText: string;
}

const LoadingIndicator = ({ displayText }: Props) => {
  return (
    <div className="px-4 py-2 mt-2 bg-muted text-black">
      <Loader2 className="animate-spin inline" /> {displayText}...
    </div>
  );
};

export default LoadingIndicator;
