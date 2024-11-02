import useAPI from "@/hooks/useAPI";
import { HubData, TAFData } from "@/lib/types";
import { useState } from "react";
import { Button } from "./ui/button";
import { Binoculars, Loader2, Notebook, Pencil, Plane } from "lucide-react";

const HubDiscussion = () => {
  const [site, setSite] = useState<string>("cyyc");

  const { data: hubData, isLoading: hubIsLoading } = useAPI<HubData>("alpha/hubs", [{ param: "site", value: site }]);
  const { data: tafData, isLoading: tafIsLoading } = useAPI<TAFData>("alpha/taf", [{ param: "site", value: site }]);

  const HUBS = ["cyvr", "cyyc", "cyyz", "cyul"];

  return (
    <>
      <div className="ps-2 text-2xl mt-2 font-bold py-2 border-y-2 border-black portrait:text-center">
        <h2 className="landscape:inline me-2">Hub Discussions: </h2>
        {HUBS.map((h, i) => (
          <Button
            variant={site === h ? "default" : "secondary"}
            className="mt-2 rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
            key={i}
            onClick={() => setSite(h)}
          >
            {h.toUpperCase()}
          </Button>
        ))}
      </div>
      {hubIsLoading ? (
        <div className="px-2">
          <Loader2 className="animate-spin" /> Loading...
        </div>
      ) : (
        ""
      )}

      {hubData?.status === "success" ? (
        <div>
          <div className="mt-2 px-4">
            <Notebook className="inline" />
            <h3 className="text-bold px-2 inline">Discussion for {site.toUpperCase()}:</h3>
          </div>
          <div className="font-mono px-4 py-2 mt-2 bg-neutral-300 text-black whitespace-pre-wrap">
            {hubData?.hubData.header}
            <br />
            <br />
            {hubData?.hubData.discussion}
          </div>
          <div className="landscape:grid grid-rows-1 landscape:grid-cols-2 bg-neutral-300 ">
            <div className="landscape:col-start-1 landscape:row-start-1">
              <div className="px-4 py-2 bg-neutral-800">
                <Binoculars className="inline" />
                <h3 className="mt-2 text-bold px-2 inline">Outlook:</h3>
              </div>
              <div className="font-mono p-4 py-2 mt-2 bg-neutral-300 text-black whitespace-pre-wrap">
                {hubData?.hubData.outlook}
              </div>
            </div>
            <div className="landscape:col-start-1 landscape:row-start-2">
              <div className="mt-2 px-4 py-2 bg-neutral-800">
                <Pencil className="inline" />
                <h3 className="mt-2 text-bold px-2 inline">Forecaster:</h3>
              </div>
              <div className="font-mono px-4 py-2 mt-2 bg-neutral-300 text-black">
                {hubData?.hubData.forecaster}/{hubData?.hubData.office}
              </div>
            </div>
            <div className="landscape:col-start-2 landscape:row-start-1 landscape:row-span-2 landscape:border-s-2 landscape:border-black ">
              <div className="portrait:mt-2 px-4 py-2 bg-neutral-800">
                <Plane className="inline" />
                <h3 className="mt-2 text-bold px-2 inline">TAF</h3>
              </div>
              <div className="font-mono px-4 py-2 mt-2 bg-neutral-300 text-black">
                {tafIsLoading ? "Loading TAF" : ""}
                {tafData ? (
                  <>
                    <div>{tafData.taf.main}</div>
                    {tafData.taf.partPeriods.map((p) => (
                      <div className="ms-8 -indent-4">{p}</div>
                    ))}
                    <div>{tafData.taf.rmk}</div>
                  </>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
      {hubData?.status === "error" ? <div>{hubData?.status}</div> : ""}
    </>
  );
};

export default HubDiscussion;
