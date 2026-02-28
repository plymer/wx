import type { Panel } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/Card";

interface OutlookCardProps {
  panel: Panel;
  onClick?: () => void;
}

const prettyValid = (valid: string): string => {
  const returnValid = "Day " + valid.split("_")[1];
  return returnValid;
};

const OutlookCard = ({ panel, onClick }: OutlookCardProps) => {
  return (
    <>
      <Card onClick={onClick}>
        <CardHeader>
          <CardTitle>{prettyValid(panel.valid)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <img src={panel.url} />
          </div>
        </CardContent>
        <CardFooter>Panel created: {panel.date}</CardFooter>
      </Card>
    </>
  );
};
export default OutlookCard;
