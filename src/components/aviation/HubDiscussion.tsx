import useAPI from "@/hooks/useAPI";
import { HubData, TAFData } from "@/lib/types";
import { Button } from "../ui/button";
import { Binoculars, Loader2, Notebook, Pencil, Plane } from "lucide-react";
import { useAviationContext } from "@/contexts/aviationContext";
import { useEffect, useState } from "react";

const HubDiscussion = () => {
  const [hubLoading, setHubLoading] = useState<boolean>(true);
  const [tafLoading, setTafLoading] = useState<boolean>(true);
  const [hubDataError, setHubDataError] = useState<Error | null>(null);
  const [tafDataError, setTafDataError] = useState<Error | null>(null);

  const hub = useAviationContext();

  const {
    data: hubData,
    isLoading: hubIsLoading,
    error: hubError,
  } = useAPI<HubData>("alpha/hubs", [{ param: "site", value: hub.hub }]);
  const {
    data: tafData,
    isLoading: tafIsLoading,
    error: tafError,
  } = useAPI<TAFData>("alpha/taf", [{ param: "site", value: hub.hub }]);

  useEffect(() => {
    setTafLoading(tafIsLoading);
    setHubLoading(hubIsLoading);
    setTafDataError(tafError);
    setHubDataError(hubError);
  }, [hub.hub, hubIsLoading, tafIsLoading, hubError, tafError]);

  const HUBS = [
    { ident: "cyvr", name: "Vancouver Intl Airport" },
    { ident: "cyyc", name: "Calgary Intl Airport" },
    { ident: "cyyz", name: "Pearson Intl Airport" },
    { ident: "cyul", name: "Trudeau Intl Airport" },
  ];

  return (
    <>
      <div className="md:ps-2 text-2xl mt-2 font-bold md:py-2 md:border-y-2 border-black portrait:text-center">
        <h2 className="md:inline max-md:hidden me-2">Hub Discussions:</h2>
        {HUBS.map((h, i) => (
          <Button
            variant={hub.hub === h.ident ? "selected" : "secondary"}
            className="md:mt-2 rounded-none md:first-of-type:rounded-s-md md:last-of-type:rounded-e-md max-md:w-1/4"
            key={i}
            onClick={() => {
              hub.setHub(h.ident);
              hub.setHubName(h.name);
            }}
          >
            {h.ident.toUpperCase()}
          </Button>
        ))}
      </div>

      {hubLoading ? (
        <div className="px-2 bg-neutral-800 text-white">
          <Loader2 className="animate-spin inline" /> Loading Hub Data...
        </div>
      ) : (
        ""
      )}

      {!hubLoading && !hubDataError && hubData?.status === "success" ? (
        <>
          <div>
            <div className="py-2 px-4 bg-neutral-800">
              <Notebook className="inline" />
              <h3 className="text-bold px-2 inline">
                Discussion for {hub.hub.toUpperCase()} - {hub.hubName}:
              </h3>
            </div>
            <div className="font-mono px-4 py-2 mt-2 bg-muted text-black whitespace-pre-wrap">
              {hubData?.hubData.header}
              <br />
              <br />
              {hubData?.hubData.discussion.trim()}
            </div>
          </div>

          <div className="md:grid md:grid-rows-2 md:grid-cols-2 bg-muted">
            <div className="md:row-start-1 md:col-start-1">
              <div className="px-4 py-2 bg-neutral-800">
                <Binoculars className="inline" />
                <h3 className="text-bold p-2 inline">Outlook:</h3>
              </div>
              <div className="font-mono p-4 py-2 bg-muted text-black whitespace-pre-wrap">
                {hubData?.hubData.outlook.trim()}
              </div>
            </div>

            <div className="md:row-start-2 md:col-start-1">
              <div className="px-4 py-2 bg-neutral-800">
                <Pencil className="inline" />
                <h3 className="text-bold p-2 inline">Forecaster:</h3>
              </div>
              <div className="font-mono px-4 py-2 bg-muted text-black whitespace-pre-wrap">
                {hubData?.hubData.forecaster}/{hubData?.hubData.office}
              </div>
            </div>
            <div className="md:col-start-2 md:row-start-1 md:row-span-2 md:border-s-2 md:border-black ">
              {!tafLoading && !tafDataError && tafData?.status === "success" ? (
                <>
                  <div className="px-4 py-2 bg-neutral-800">
                    <Plane className="inline" />
                    <h3 className="text-bold p-2 inline">TAF</h3>
                  </div>
                  <div className="font-mono px-4 py-2 bg-muted text-black whitespace-pre-wrap">
                    <div>{tafData?.taf?.main}</div>
                    {tafData?.taf?.partPeriods.map((p, i) => (
                      <div key={i} className="ms-8 -indent-4">
                        {p}
                      </div>
                    ))}
                    <div>{tafData?.taf?.rmk}</div>
                  </div>
                </>
              ) : (
                <div>{tafData?.status}</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div>{hubData?.status}</div>
      )}

      {tafLoading ? (
        <div className="px-2 md:col-span-2 bg-neutral-800 text-white">
          <Loader2 className="animate-spin inline" /> Loading TAF Data...
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default HubDiscussion;
