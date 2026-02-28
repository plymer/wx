import type { OutlookData, OutlookOffice } from "@/lib/types";
import Button from "../ui/Button";
import { useOutlookActions, useOutlookOffice, useOutlookRegion, useOutlookValidPeriod } from "@/stateStores/outlook";
import OutlookGrid from "./OutlookGrid";
import { useMemo } from "react";
import OutlookCarousel from "./OutlookCarousel";
import type { OutlookOffices } from "@shared/lib/types";

interface Props {
  data: OutlookData | null;
}

const OutlookContainer = ({ data }: Props) => {
  const office = useOutlookOffice();
  const region = useOutlookRegion();
  const validPeriod = useOutlookValidPeriod();
  const actions = useOutlookActions();

  const officesInData = data ? Object.keys(data) : [];
  const regionsInOffice = office && data && data[office] ? Object.keys(data[office]) : [];

  // select the office and region stored in state, unless those choices don't exist in the current API data; then we default back to the 0th office and it's 0th region in the data (if they exist)
  const selectedOffice: OutlookOffice | null = useMemo(() => {
    if (office && officesInData.includes(office)) {
      return office;
    } else if (officesInData.length > 0) {
      actions.setOffice(officesInData[0] as OutlookOffice);
      return officesInData[0] as OutlookOffice;
    } else {
      return null;
    }
  }, [office, officesInData]);

  const selectedRegion = useMemo(() => {
    if (region && regionsInOffice.includes(region)) {
      return region;
    } else {
      return null;
    }
  }, [region, regionsInOffice]);

  const officeData = data && selectedOffice !== null ? data[selectedOffice] : null;

  if (data === null) {
    return (
      <p className="w-fit mx-auto text-sm italic text-center px-4 py-2 border-white rounded-lg border-2 my-8">
        No Outlooks available
      </p>
    );
  }

  if (selectedOffice === null) {
    return <p className="text-sm italic">No outlooks available for this office.</p>;
  }

  return (
    <>
      <nav className="flex items-center justify-center md:p-2 max-md:pt-2">
        <label className="me-2 max-md:hidden">Office:</label>
        {Object.keys(data).map((o) => (
          <Button
            key={o}
            className={`${
              office === o ? "active" : ""
            } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md grow`}
            onClick={() => actions.setOffice(o as OutlookOffices)}
          >
            {o.toLocaleUpperCase()}
          </Button>
        ))}
      </nav>
      <nav className="flex justify-center items-center md:p-2 max-md:pt-2">
        <label className="me-2 max-md:hidden">Region:</label>
        <Button
          className={`${
            selectedRegion === null ? "active" : ""
          } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md grow`}
          onClick={() => actions.setRegion(null)}
        >
          All
        </Button>
        {officeData &&
          Object.entries(officeData).map(([regionKey, regionData]) => (
            <Button
              key={regionKey}
              className={`${
                selectedRegion === regionKey ? "active" : ""
              } rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md grow`}
              onClick={() => actions.setRegion(regionKey)}
            >
              {regionData.name}
            </Button>
          ))}
      </nav>
      {!validPeriod && officeData && <OutlookGrid officeData={officeData} />}
      {validPeriod && officeData && region && <OutlookCarousel officeData={officeData[region]} />}
    </>
  );
};

export default OutlookContainer;
