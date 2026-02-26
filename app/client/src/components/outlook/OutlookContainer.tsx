import type { OUTLOOK_CONFIG } from "@/config/public";
import type { OutlookData } from "@/lib/types";
import Button from "../ui/Button";
import { useOutlookActions, useOutlookOffice, useOutlookRegion, useOutlookValid } from "@/stateStores/outlook";
import OutlookGrid from "./OutlookGrid";
import OutlookCarousel from "./OutlookCarousel";

interface Props {
  data: OutlookData | undefined;
}

const OutlookContainer = ({ data }: Props) => {
  const office = useOutlookOffice();
  const region = useOutlookRegion();
  const valid = useOutlookValid();
  const actions = useOutlookActions();
  const officeData = data ? data[office] : null;

  if (officeData == null || data === undefined) {
    return <p className="text-sm italic">No outlooks available for this office.</p>;
  }

  return (
    <>
      <nav className="md:p-2 max-md:pt-2">
        <label className="me-2 max-md:hidden">Office:</label>
        {(Object.keys(data) as Array<keyof typeof OUTLOOK_CONFIG>).map((o) => (
          <Button
            key={o}
            className={`${
              office === o ? "active" : ""
            } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/5`}
            onClick={() => actions.setOffice(o as keyof typeof OUTLOOK_CONFIG)}
          >
            {o.toLocaleUpperCase()}
          </Button>
        ))}
      </nav>
      <nav className="md:p-2 max-md:pt-2">
        <label className="me-2 max-md:hidden">Region:</label>
        {officeData &&
          Object.entries(officeData).map(([regionKey, regionData]) => (
            <Button
              key={regionKey}
              className={`${
                region === regionKey ? "active" : ""
              } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/5`}
              onClick={() => actions.setRegion(regionKey)}
            >
              {regionData.name}
            </Button>
          ))}
      </nav>
      {!valid && <OutlookGrid officeData={officeData} />}
      {valid && region && <OutlookCarousel officeData={officeData[region]} />}
      {}
    </>
  );
};

export default OutlookContainer;
