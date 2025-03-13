import { Loader2 } from "lucide-react";

interface Props {
  displayText: string;
  className?: string;
}

const LoadingIndicator = ({ displayText, className }: Props) => {
  return (
    <div className={`px-4 py-2 mt-2 bg-muted text-black ${className}`}>
      <Loader2 className="animate-spin inline" /> {displayText}...
    </div>
  );
};

export default LoadingIndicator;
