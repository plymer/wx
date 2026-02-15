import type { OUTLOOK_CONFIG } from "@/config/public";
import type { OutlookData } from "@/lib/types";
import Button from "../ui/Button";
import { useOutlookActions, useOutlookOffice } from "@/stateStores/outlook";
import type { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";

interface Props {
  data?: OutlookData;
}

const OutlookContainer = ({ data }: Props) => {
  const office = useOutlookOffice();
  const actions = useOutlookActions();
  const officeData = data ? data[office] : null;

  if (officeData == null || data === undefined) {
    return <p className="text-sm italic">No outlooks available for this office.</p>;
  }

  console.log(officeData);
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
            {o}
          </Button>
        ))}
      </nav>
      <nav className="md:p-2 max-md:pt-2">
        <label className="me-2 max-md:hidden">Region:</label>
        {Object.entries(officeData).map(([regionKey, regionArray]) =>
          regionArray.map((item: { id: string; office: string; name: string }) => (
            <Button
              key={item.id}
              className={`${
                item.office === office ? "active" : ""
              } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/5`}
              onClick={() => actions.setRegion(item.id)}
            >
              {item.name}
            </Button>
          )),
        )}
      </nav>
    </>
  );
};

export default OutlookContainer;
