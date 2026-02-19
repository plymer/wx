import type { Panel } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/Card";

interface OutlookCardProps {
  panel: Panel;
  onClick?: () => void;
}

const OutlookCard = ({ panel, onClick }: OutlookCardProps) => {
  return (
    <>
      <Card onClick={onClick}>
        <CardHeader>
          <CardTitle>{panel.valid}</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            {panel.url}
            <img src={panel.url} />
          </div>
        </CardContent>
        <CardFooter>Panel created: {panel.date}</CardFooter>
      </Card>
    </>
  );
};
export default OutlookCard;
