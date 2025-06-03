import { Loader2 } from "lucide-react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  displayText: string;
}

const AppLoadingIndicator = ({ displayText, ...props }: Props) => {
  return (
    <div className={props.className}>
      <Loader2 className="animate-spin inline me-2" /> {displayText}...
    </div>
  );
};

export default AppLoadingIndicator;
